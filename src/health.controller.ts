import { Controller, Get } from '@nestjs/common';
import {
  HealthCheckService,
  HealthCheck,
  MemoryHealthIndicator,
} from '@nestjs/terminus';
import { LibrarianService } from './akuri-core/librarian/librarian.service';
import { McpService } from './mcp/mcp.service';
import * as fs from 'fs';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private memory: MemoryHealthIndicator,
    private librarian: LibrarianService,
    private mcp: McpService,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      // Check memory usage
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024), // 150MB

      // Check filesystem access to docs directories
      () => {
        try {
          const docsPaths = this.librarian.docsPaths;
          const results = docsPaths.map(docsPath => {
            const exists = fs.existsSync(docsPath);
            const isReadable = exists && fs.statSync(docsPath).isDirectory();
            return { path: docsPath, exists, isReadable };
          });

          const allAccessible = results.every(r => r.exists && r.isReadable);
          const inaccessiblePaths = results.filter(r => !r.exists || !r.isReadable);

          if (!allAccessible) {
            return {
              filesystem: {
                status: 'down',
                message: `Some docs directories are not accessible: ${inaccessiblePaths.map(r => r.path).join(', ')}`,
                details: results,
              },
            };
          }

          return {
            filesystem: {
              status: 'up',
              message: `All ${docsPaths.length} docs directories accessible`,
              directories: docsPaths,
            },
          };
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          return {
            filesystem: {
              status: 'down',
              message: `Filesystem error: ${errorMessage}`,
            },
          };
        }
      },

      // Check database health (Orama)
      async () => {
        try {
          // Try to access the database - this will throw if not initialized
          const db = (this.librarian as any).db;
          if (!db) {
            return {
              database: {
                status: 'down',
                message: 'Database not initialized',
              },
            };
          }

          // Check if database has documents (using count from orama)
          const { count } = await import('@orama/orama');
          const docCount = count(db);

          return {
            database: {
              status: 'up',
              documentCount: docCount,
              message: `Database healthy with ${docCount} documents`,
            },
          };
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          return {
            database: {
              status: 'down',
              message: `Database error: ${errorMessage}`,
            },
          };
        }
      },

      // Check MCP service health
      () => {
        try {
          // Check if MCP server is initialized
          const server = (this.mcp as any).server;
          if (!server) {
            return {
              mcp: {
                status: 'down',
                message: 'MCP server not initialized',
              },
            };
          }

          return {
            mcp: {
              status: 'up',
              message: 'MCP server operational',
            },
          };
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          return {
            mcp: {
              status: 'down',
              message: `MCP service error: ${errorMessage}`,
            },
          };
        }
      },
    ]);
  }

  @Get('detailed')
  @HealthCheck()
  async detailedCheck() {
    const basicHealth = await this.check();
    const searchMetrics = this.librarian.getMetrics();

    // Add additional metrics
    const docsPaths = this.librarian.docsPaths;
    const docsPathsStatus = docsPaths.map(path => ({
      path,
      exists: fs.existsSync(path),
    }));

    const detailedHealth = {
      ...basicHealth,
      details: {
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.version,
        platform: process.platform,
        memory: process.memoryUsage(),
        docsPaths,
        docsPathsStatus,
        searchMetrics,
      },
    };

    return detailedHealth;
  }
}
