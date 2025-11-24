import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../../common/logger/logger.service';
import * as chokidar from 'chokidar';
import * as fs from 'fs';
import * as path from 'path';
import * as matter from 'gray-matter';
import { create, insert, search, count, remove, AnyOrama } from '@orama/orama';

@Injectable()
export class LibrarianService implements OnModuleInit {
  private readonly logger = new Logger(LibrarianService.name);
  readonly docsPaths: string[];
  private db: AnyOrama;

  // Metrics
  private searchCount = 0;
  private totalSearchTime = 0;
  private lastSearchTime = 0;

  constructor(
    private configService: ConfigService,
    private loggerService: LoggerService,
  ) {
    // Get docs paths from environment variable - required
    const docsPathConfig = this.configService.get<string>('AKURI_DOCS_PATH');
    if (!docsPathConfig) {
      throw new Error('AKURI_DOCS_PATH environment variable is required');
    }

    // Support multiple paths separated by commas
    this.docsPaths = docsPathConfig.split(',').map(path => path.trim()).filter(path => path.length > 0);

    if (this.docsPaths.length === 0) {
      throw new Error('At least one valid path must be provided in AKURI_DOCS_PATH');
    }

    // Set logger context after validation
    this.loggerService.setContext?.('LibrarianService');

    this.logger.log(`Documentos configurados en: ${this.docsPaths.join(', ')}`);
  }

  async onModuleInit() {
    this.loggerService.info('🚀 Iniciando sistema de búsqueda V3...', {
      operation: 'init',
    });
    this.initDB();
    await this.initialScan();
    this.startWatcher();
  }

  private initDB() {
    this.db = create({
      schema: {
        id: 'string',
        filepath: 'string',
        content: 'string',
        metadata: 'string',
        tags: 'string',
      },
    });
    this.loggerService.info('🧠 DB Orama lista', { operation: 'db_init' });
  }

  private async initialScan() {
    this.loggerService.info('📂 Escaneando documentos desde múltiples fuentes...', {
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
      this.loggerService.info(`🔍 Escaneando directorio: ${docsPath}`, {
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
    this.loggerService.info(`✅ Total indexado: ${totalDocs} docs desde ${this.docsPaths.length} fuentes`, {
      operation: 'scan_complete',
      totalDocs,
      sources: this.docsPaths.length,
    });
  }

  private startWatcher() {
    // Create a watcher for each directory
    for (const docsPath of this.docsPaths) {
      this.loggerService.info(`👀 Configurando watcher para: ${docsPath}`, {
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
      const baseDir = this.docsPaths.find(docsPath => filePath.startsWith(docsPath));
      if (!baseDir) {
        this.loggerService.warn(`File outside configured directories: ${filePath}`, {
          operation: 'index_skip',
          filePath,
        });
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

      const docData = data as { tags?: string[] };
      await insert(this.db, {
        id: relativePath,
        filepath: relativePath,
        content: content || '',
        metadata: JSON.stringify(data || {}),
        tags: Array.isArray(docData.tags) ? docData.tags.join(',') : '',
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

  // --- AQUÍ ESTÁ EL CAMBIO IMPORTANTE ---
  async searchDocs(query: string, limit = 5) {
    const startTime = Date.now();

    try {
      // Obtener el conteo real de la instancia actual
      const totalDocs = count(this.db);

      // --- MODO DIAGNÓSTICO ---
      // Si Kilo pregunta, le respondemos con el estado de la memoria
      this.loggerService.info(`Query: "${query}" | Docs en RAM: ${totalDocs}`, {
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
            snippet: `⚠️ ALERTA CRÍTICA: La base de datos en memoria tiene 0 documentos. Las rutas configuradas son: ${this.docsPaths.join(', ')}`,
          },
        ];
      }

      // Hack para ver si el buscador funciona: Si la query es "dump", devuelve todo
      const searchTerm = query === 'dump' || query === 'status' ? '' : query;

      const result = await search(this.db, {
        term: searchTerm,
        limit: limit,
        properties: '*', // Buscar en todo
        threshold: 0, // Tolerancia máxima
      });

      // Update metrics
      this.searchCount++;
      this.lastSearchTime = Date.now() - startTime;
      this.totalSearchTime += this.lastSearchTime;

      // Si no encuentra nada por término, retornamos mensaje de ayuda
      if (result.count === 0) {
        return [
          {
            path: 'SIN_RESULTADOS',
            score: 0,
            metadata: { info: 'debug' },
            snippet: `La DB tiene ${totalDocs} docs, pero la búsqueda de "${query}" no produjo coincidencias.`,
          },
        ];
      }

      // Log successful search
      this.loggerService.logSearch(
        query,
        result.hits.length,
        this.lastSearchTime,
      );

      return result.hits.map((hit) => ({
        path: hit.document.filepath as string,
        score: hit.score,
        metadata: JSON.parse(hit.document.metadata as string) as Record<
          string,
          any
        >,
        snippet: (hit.document.content as string).substring(0, 200) + '...',
      }));
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
          snippet: 'Error ejecutando la búsqueda en Orama.',
        },
      ];
    }
  }
}
