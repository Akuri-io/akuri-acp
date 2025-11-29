import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../../common/logger/logger.service';
import { PathsService } from '../../paths/paths.service';
import * as chokidar from 'chokidar';
import * as fs from 'fs';
import * as path from 'path';
import * as matter from 'gray-matter';
import { create, insert, search, count, remove, AnyOrama } from '@orama/orama';

@Injectable()
export class LibrarianService implements OnModuleInit {
  private readonly logger = new Logger(LibrarianService.name);
  private docsPaths: string[];
  private db: AnyOrama;

  // Metrics
  private searchCount = 0;
  private totalSearchTime = 0;
  private lastSearchTime = 0;

  constructor(
    private configService: ConfigService,
    private loggerService: LoggerService,
    private pathsService: PathsService,
  ) {
    // Set logger context after validation
    this.loggerService.setContext?.('LibrarianService');
  }

  private async loadAllPaths() {
    try {
      // Load all paths from PathsService (includes env and dynamic active paths)
      const allPaths = await this.pathsService.loadPaths();

      // Filter only active paths and extract their paths
      this.docsPaths = allPaths
        .filter((path) => path.isActive)
        .map((path) => path.path);

      this.logger.log(
        `Loaded ${this.docsPaths.length} active document paths: ${this.docsPaths.join(', ')}`,
      );
    } catch (error) {
      this.loggerService.error('Error loading paths from PathsService', {
        operation: 'load_paths_error',
        error: (error as Error).message,
      });
      // Fallback to env paths only
      const docsPathConfig = this.configService.get<string>('AKURI_DOCS_PATH');
      if (docsPathConfig) {
        this.docsPaths = docsPathConfig
          .split(',')
          .map((path) => path.trim())
          .filter((path) => path.length > 0);
      } else {
        this.docsPaths = [];
      }
    }
  }

  async onModuleInit() {
    this.loggerService.info('🚀 Starting search system V3...', {
      operation: 'init',
    });
    this.initDB();

    // Load all paths (env + dynamic active)
    await this.loadAllPaths();

    // Only scan and watch if we have paths configured
    if (this.docsPaths.length > 0) {
      // Ejecutar scan en segundo plano sin bloquear la inicialización
      this.initialScan().catch((err) => {
        this.loggerService.error('Error during initial scan', {
          operation: 'init_scan_error',
          error: err.message,
        });
      });

      this.startWatcher();
    } else {
      this.loggerService.info(
        'No document paths configured, skipping scan and watcher setup',
        {
          operation: 'init_skip',
        },
      );
    }
  }

  private initDB() {
    this.db = create({
      schema: {
        id: 'string',
        filepath: 'string',
        content: 'string',
        metadata: 'string',
        tags: 'string',
        summary: 'string',
        source_type: 'string',
      },
    });
    this.loggerService.info('🧠 Orama DB ready (Schema V2)', {
      operation: 'db_init',
    });
  }

  // ... (initialScan and startWatcher remain similar, skipping for brevity in replacement if possible, but replace_file_content needs contiguous block.
  // Since I need to change initDB (top) and indexFile (middle) and searchDocs (bottom), I should probably use multi_replace or separate calls.
  // I will use multi_replace for this.)

  private async initialScan() {
    this.loggerService.info('📂 Scanning documents from multiple sources...', {
      operation: 'scan_start',
      sources: this.docsPaths.length,
    });

    const getAllFiles = (dir: string, fileList: string[] = []) => {
      try {
        const files = fs.readdirSync(dir);
        files.forEach((file) => {
          const filePath = path.join(dir, file);
          if (fs.statSync(filePath).isDirectory()) {
            if (!file.startsWith('.') && file !== 'node_modules')
              getAllFiles(filePath, fileList);
          } else {
            if (file.endsWith('.md')) fileList.push(filePath);
          }
        });
      } catch {
        // Ignore directories that can't be read
      }
      return fileList;
    };

    // Process all directories
    const allMds: string[] = [];
    for (const docsPath of this.docsPaths) {
      this.loggerService.info(`🔍 Scanning directory: ${docsPath}`, {
        operation: 'scan_directory',
        directory: docsPath,
      });
      const files = getAllFiles(docsPath);
      allMds.push(...files);
    }

    for (const file of allMds) {
      await this.indexFile(file);
    }
    const totalDocs = count(this.db);
    this.loggerService.info(
      `✅ Total indexed: ${totalDocs} docs from ${this.docsPaths.length} sources`,
      {
        operation: 'scan_complete',
        totalDocs,
        sources: this.docsPaths.length,
      },
    );
  }

  private startWatcher() {
    // Create a watcher for each directory
    for (const docsPath of this.docsPaths) {
      this.loggerService.info(`👀 Setting up watcher for: ${docsPath}`, {
        operation: 'watcher_setup',
        directory: docsPath,
      });

      const watcher = chokidar.watch(docsPath, {
        ignored: /(^|[/\\])\../,
        persistent: true,
        ignoreInitial: true,
        depth: 5,
      });

      watcher
        .on('add', (p) => void this.indexFile(p))
        .on('change', (p) => void this.indexFile(p))
        .on('error', (error) => {
          this.loggerService.error(`Watcher error for ${docsPath}`, {
            operation: 'watcher_error',
            directory: docsPath,
            error: (error as Error).message,
          });
        });
    }
  }

  private async indexFile(filePath: string) {
    if (!filePath.endsWith('.md')) return;

    try {
      // Find the base directory for this file
      const baseDir = this.docsPaths.find((docsPath) =>
        filePath.startsWith(docsPath),
      );
      if (!baseDir) {
        this.loggerService.warn(
          `File outside configured directories: ${filePath}`,
          {
            operation: 'index_skip',
            filePath,
          },
        );
        return;
      }

      const fileContent = fs.readFileSync(filePath, 'utf8');
      const { data, content } = matter(fileContent);
      const relativePath = path.relative(baseDir, filePath);

      // --- FIX: PATRÓN UPSERT (Borrar si existe, luego insertar) ---
      try {
        // Intentamos borrarlo primero por si ya existe (update)
        await remove(this.db, relativePath);
      } catch {
        // Si no existe, 'remove' fallará, pero no nos importa, lo ignoramos
      }
      // -------------------------------------------------------------

      const docData = data as {
        tags?: string[];
        summary?: string;
        source_type?: string;
      };

      // Determine source_type heuristic
      let sourceType = docData.source_type || 'general';
      if (filePath.includes('akuri-acp-documents')) sourceType = 'internal';
      // TODO: Add logic for workspace/project detection based on path

      await insert(this.db, {
        id: relativePath,
        filepath: relativePath,
        content: content || '',
        metadata: JSON.stringify(data || {}),
        tags: Array.isArray(docData.tags) ? docData.tags.join(',') : '',
        summary: docData.summary || content.substring(0, 200),
        source_type: sourceType,
      });

      // Opcional: Loguear éxito en debug
      // console.error(`[INDEX] OK: ${relativePath}`);
    } catch (error) {
      this.loggerService.error(
        `File indexing error: ${path.basename(filePath)}`,
        {
          operation: 'index_error',
          filePath: path.basename(filePath),
          error: (error as Error).message,
        },
      );
    }
  }

  // Metrics getter
  getMetrics() {
    return {
      searchCount: this.searchCount,
      averageSearchTime:
        this.searchCount > 0 ? this.totalSearchTime / this.searchCount : 0,
      lastSearchTime: this.lastSearchTime,
      totalSearchTime: this.totalSearchTime,
    };
  }

  getDocsPaths() {
    return this.docsPaths;
  }

  async reloadPaths(silent: boolean = false) {
    await this.loadAllPaths();
    if (!silent) {
      this.loggerService.info(
        `Paths reloaded dynamically: ${this.docsPaths.join(', ')}`,
        {
          operation: 'dynamic_reload',
        },
      );
    }
    // Reindex with new paths
    await this.reindex();
  }

  async updatePaths(newPaths: string[]) {
    // This method is deprecated - paths are now managed by PathsService
    // Reload all paths from PathsService
    await this.loadAllPaths();

    this.loggerService.info(
      `Paths reloaded from PathsService: ${this.docsPaths.join(', ')}`,
      {
        operation: 'reload_paths',
      },
    );

    // Reindex with updated paths
    await this.reindex();
  }

  async reindex() {
    this.loggerService.info('🔄 Reindexing documents...', {
      operation: 'reindex_start',
    });

    // Clear the database
    // Orama doesn't have a clear method, so recreate it
    this.initDB();

    // Re-run initial scan
    await this.initialScan();

    const totalDocs = count(this.db);
    this.loggerService.info(`✅ Reindexing completed: ${totalDocs} documents`, {
      operation: 'reindex_complete',
      totalDocs,
    });

    return totalDocs;
  }

  // --- AQUÍ ESTÁ EL CAMBIO IMPORTANTE ---
  async searchDocs(query: string, limit = 5) {
    const startTime = Date.now();

    try {
      // Obtener el conteo real de la instancia actual
      const totalDocs = count(this.db);

      // --- MODO DIAGNÓSTICO ---
      // Si Kilo pregunta, le respondemos con el estado de la memoria
      this.loggerService.info(`Query: "${query}" | Docs in RAM: ${totalDocs}`, {
        operation: 'search_start',
        query,
        totalDocs,
      });

      // Si la DB está vacía, avisar explícitamente
      if (totalDocs === 0) {
        // Update metrics even for empty DB case
        this.searchCount++;
        this.lastSearchTime = Date.now() - startTime;
        this.totalSearchTime += this.lastSearchTime;

        return [
          {
            path: 'SISTEMA_VACIO',
            score: 0,
            metadata: { status: 'error' },
            snippet: `⚠️ CRITICAL ALERT: The in-memory database has 0 documents. Configured paths are: ${this.docsPaths.join(', ')}`,
          },
        ];
      }

      // Hack para ver si el buscador funciona: Si la query es "dump", devuelve todo
      const searchTerm = query === 'dump' || query === 'status' ? '' : query;

      // Search with higher limit for re-ranking
      const result = await search(this.db, {
        term: searchTerm,
        limit: limit * 3, // Fetch more for re-ranking
        properties: '*',
        threshold: 0,
      });

      // Update metrics
      this.searchCount++;
      this.lastSearchTime = Date.now() - startTime;
      this.totalSearchTime += this.lastSearchTime;

      if (result.count === 0) {
        return [
          {
            path: 'SIN_RESULTADOS',
            score: 0,
            metadata: { info: 'debug' },
            snippet: `The DB has ${totalDocs} docs, but the search for "${query}" produced no matches.`,
          },
        ];
      }

      // Re-ranking logic (Boosting)
      const hits = result.hits.map((hit) => {
        let score = hit.score;
        const doc = hit.document as any;

        // Apply boosts
        if (doc.source_type === 'project') score *= 2.0;
        if (doc.source_type === 'workspace') score *= 1.5;
        if (doc.source_type === 'internal') score *= 0.8;

        return {
          path: doc.filepath as string,
          score: score,
          metadata: JSON.parse(doc.metadata as string),
          snippet: (doc.summary || doc.content).substring(0, 300) + '...',
          source_type: doc.source_type,
        };
      });

      // Sort by new score and slice
      hits.sort((a, b) => b.score - a.score);
      const finalHits = hits.slice(0, limit);

      this.loggerService.logSearch(
        query,
        finalHits.length,
        this.lastSearchTime,
      );

      return finalHits;
    } catch (e) {
      // Update metrics even on error
      this.searchCount++;
      this.lastSearchTime = Date.now() - startTime;
      this.totalSearchTime += this.lastSearchTime;

      this.loggerService.error(`Search error: ${e}`, {
        operation: 'search_error',
        query,
        error: (e as Error).message,
        duration: this.lastSearchTime,
      });
      return [
        {
          path: 'ERROR_INTERNO',
          score: 0,
          metadata: { error: (e as Error).message },
          snippet: 'Error executing search in Orama.',
        },
      ];
    }
  }
}
