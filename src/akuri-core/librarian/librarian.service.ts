import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as chokidar from 'chokidar';
import * as fs from 'fs';
import * as path from 'path';
import * as matter from 'gray-matter';
import { create, insert, search, count, remove, AnyOrama } from '@orama/orama';

@Injectable()
export class LibrarianService implements OnModuleInit {
  private readonly logger = new Logger(LibrarianService.name);
  private readonly docsPath =
    '/mnt/0e67f549-8f2b-4fee-92ea-605bc0fd16ea/MULTIROOT/AKURI';
  private db: AnyOrama;

  async onModuleInit() {
    console.error(`[AKURI] 🚀 Iniciando sistema de búsqueda V3...`);
    await this.initDB();
    await this.initialScan();
    this.startWatcher();
  }

  private async initDB() {
    this.db = await create({
      schema: {
        id: 'string',
        filepath: 'string',
        content: 'string',
        metadata: 'string',
        tags: 'string',
      },
    });
    console.error('[AKURI] 🧠 DB Orama lista.');
  }

  private async initialScan() {
    // ... (Mismo código de escaneo de antes) ...
    console.error('[AKURI] 📂 Escaneando...');
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
      } catch (e) {}
      return fileList;
    };

    const allMds = getAllFiles(this.docsPath);
    for (const file of allMds) {
      await this.indexFile(file);
    }
    console.error(`[AKURI] ✅ Total indexado: ${await count(this.db)} docs.`);
  }

  private startWatcher() {
    const watcher = chokidar.watch(this.docsPath, {
      ignored: /(^|[\/\\])\../,
      persistent: true,
      ignoreInitial: true,
      depth: 5,
    });
    watcher
      .on('add', (p) => this.indexFile(p))
      .on('change', (p) => this.indexFile(p));
  }

  private async indexFile(filePath: string) {
    if (!filePath.endsWith('.md')) return;

    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const parser = (matter as any).default || matter;
      const { data, content } = parser(fileContent);
      const relativePath = path.relative(this.docsPath, filePath);

      // --- FIX: PATRÓN UPSERT (Borrar si existe, luego insertar) ---
      try {
        // Intentamos borrarlo primero por si ya existe (update)
        await remove(this.db, relativePath);
      } catch (e) {
        // Si no existe, 'remove' fallará, pero no nos importa, lo ignoramos
      }
      // -------------------------------------------------------------

      await insert(this.db, {
        id: relativePath,
        filepath: relativePath,
        content: content || '',
        metadata: JSON.stringify(data || {}),
        tags: Array.isArray(data.tags) ? data.tags.join(',') : '',
      });

      // Opcional: Loguear éxito en debug
      // console.error(`[INDEX] OK: ${relativePath}`);
    } catch (error) {
      console.error(`[ERROR] ${path.basename(filePath)}: ${error}`);
    }
  }

  // --- AQUÍ ESTÁ EL CAMBIO IMPORTANTE ---
  async searchDocs(query: string, limit = 5) {
    // Obtener el conteo real de la instancia actual
    const totalDocs = await count(this.db);

    // --- MODO DIAGNÓSTICO ---
    // Si Kilo pregunta, le respondemos con el estado de la memoria
    console.error(
      `[AKURI SEARCH] Query: "${query}" | Docs en RAM: ${totalDocs}`,
    );

    // Si la DB está vacía, avisar explícitamente
    if (totalDocs === 0) {
      return [
        {
          path: 'SISTEMA_VACIO',
          score: 0,
          metadata: { status: 'error' },
          snippet: `⚠️ ALERTA CRÍTICA: La base de datos en memoria tiene 0 documentos. La ruta configurada es: ${this.docsPath}`,
        },
      ];
    }

    // Hack para ver si el buscador funciona: Si la query es "dump", devuelve todo
    const searchTerm = query === 'dump' || query === 'status' ? '' : query;

    try {
      const result = await search(this.db, {
        term: searchTerm,
        limit: limit,
        properties: '*', // Buscar en todo
        threshold: 0, // Tolerancia máxima
      });

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

      return result.hits.map((hit) => ({
        path: hit.document.filepath,
        score: hit.score,
        metadata: JSON.parse(hit.document.metadata as string),
        snippet: (hit.document.content as string).substring(0, 200) + '...',
      }));
    } catch (e) {
      console.error(`[AKURI SEARCH ERROR] ${e}`);
      return [
        {
          path: 'ERROR_INTERNO',
          score: 0,
          metadata: { error: e.message },
          snippet: 'Error ejecutando la búsqueda en Orama.',
        },
      ];
    }
  }
}
