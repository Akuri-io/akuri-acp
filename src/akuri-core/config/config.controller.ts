import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AkuriConfigService } from './config.service';
import { LibrarianService } from '../librarian/librarian.service';
import { LoggerService } from '../../common/logger/logger.service';
import { PathsService } from '../../paths/paths.service';

interface AddPathDto {
  path: string;
}

interface TestPathDto {
  path: string;
}

@ApiTags('Configuration')
@Controller('config')
export class ConfigController {
  constructor(
    private akuriConfigService: AkuriConfigService,
    private nestConfigService: ConfigService,
    private librarianService: LibrarianService,
    private logger: LoggerService,
    private pathsService: PathsService,
  ) {}

  /**
   * Get current configuration status
   */
  @Get('status')
  @ApiOperation({
    summary: 'Get configuration status',
    description:
      'Retrieves the current status of the document indexing configuration, including initialization state, document count, and configured paths.',
  })
  @ApiResponse({
    status: 200,
    description: 'Configuration status retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        isInitialized: {
          type: 'boolean',
          description:
            'Whether the system has been initialized with document paths',
        },
        documentCount: {
          type: 'number',
          description: 'Total number of indexed documents',
        },
        paths: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of configured document paths',
        },
        lastIndexed: {
          type: 'string',
          format: 'date-time',
          description: 'Timestamp of last indexing operation',
        },
      },
    },
  })
  async getConfigStatus(): Promise<{
    isInitialized: boolean;
    documentCount: number;
    paths: string[];
    lastIndexed?: Date;
  }> {
    this.logger.info('Configuration status requested', {
      context: 'ConfigController',
      operation: 'get_status',
    });

    // Get all paths from PathsService (includes env and dynamic active paths)
    const allPaths = await this.pathsService.loadPaths();

    // Filter only active paths (same logic as LibrarianService)
    const activePaths = allPaths
      .filter((path) => path.isActive)
      .map((path) => path.path);

    // Calculate total documents across all active paths
    let totalDocuments = 0;
    for (const path of activePaths) {
      const testResult = this.akuriConfigService.testPath(path);
      totalDocuments += testResult.documentCount || 0;
    }

    return {
      isInitialized: activePaths.length > 0,
      documentCount: totalDocuments,
      paths: activePaths,
      lastIndexed: new Date(), // TODO: Track actual indexing time
    };
  }

  /**
   * Get current document paths with details
   */
  @Get('paths')
  @ApiOperation({
    summary: 'Get document paths with details',
    description:
      'Retrieves all configured document paths along with their validation status and document counts.',
  })
  @ApiResponse({
    status: 200,
    description: 'Document paths retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        paths: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              path: { type: 'string', description: 'The document path' },
              documentCount: {
                type: 'number',
                description: 'Number of documents found in this path',
              },
              exists: {
                type: 'boolean',
                description: 'Whether the path exists',
              },
              isDirectory: {
                type: 'boolean',
                description: 'Whether the path is a directory',
              },
            },
          },
        },
      },
    },
  })
  async getDocumentPaths(): Promise<{
    paths: Array<{
      path: string;
      documentCount: number;
      exists: boolean;
      isDirectory: boolean;
    }>;
  }> {
    // Get all paths from PathsService (includes env and dynamic active paths)
    const allPaths = await this.pathsService.loadPaths();

    // Filter only active paths (same logic as LibrarianService)
    const activePaths = allPaths
      .filter((path) => path.isActive)
      .map((path) => path.path);

    const pathsWithDetails = activePaths.map((path) => {
      const testResult = this.akuriConfigService.testPath(path);
      return {
        path,
        documentCount: testResult.documentCount || 0,
        exists: testResult.valid,
        isDirectory: testResult.valid,
      };
    });

    this.logger.info('Document paths requested', {
      context: 'ConfigController',
      operation: 'get_paths',
      pathCount: activePaths.length,
    });

    return { paths: pathsWithDetails };
  }

  /**
   * Add a new document path
   */
  @Post('paths')
  @ApiOperation({
    summary: 'Add document path',
    description:
      'Adds a new path to the document indexing configuration. The path will be validated before being added.',
  })
  @ApiResponse({
    status: 201,
    description: 'Document path added successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'Path added successfully with 25 documents',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid path provided',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Path does not exist' },
      },
    },
  })
  async addDocumentPath(
    @Body() dto: AddPathDto,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const testResult = this.akuriConfigService.testPath(dto.path);

      if (!testResult.valid) {
        throw new HttpException(
          {
            success: false,
            message: testResult.message,
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      await this.akuriConfigService.addDocumentPath(dto.path);

      this.logger.info('Document path added', {
        context: 'ConfigController',
        operation: 'add_path',
        path: dto.path,
        documentCount: testResult.documentCount,
      });

      return {
        success: true,
        message: `Path added successfully with ${testResult.documentCount} documents`,
      };
    } catch (error) {
      this.logger.error('Failed to add document path', {
        context: 'ConfigController',
        operation: 'add_path',
        path: dto.path,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Remove a document path
   */
  @Delete('paths/:path')
  @ApiOperation({
    summary: 'Remove document path',
    description:
      'Removes a document path from the indexing configuration. The path parameter should be URL-encoded if it contains special characters.',
  })
  @ApiResponse({
    status: 200,
    description: 'Document path removed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Path removed successfully' },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Failed to remove path',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Failed to remove path' },
      },
    },
  })
  async removeDocumentPath(
    @Param('path') path: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      // URL decode the path parameter
      const decodedPath = decodeURIComponent(path);

      await this.akuriConfigService.removeDocumentPath(decodedPath);

      this.logger.info('Document path removed', {
        context: 'ConfigController',
        operation: 'remove_path',
        path: decodedPath,
      });

      return {
        success: true,
        message: 'Path removed successfully',
      };
    } catch (error) {
      this.logger.error('Failed to remove document path', {
        context: 'ConfigController',
        operation: 'remove_path',
        path,
        error: error.message,
      });
      throw new HttpException(
        {
          success: false,
          message: 'Failed to remove path',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Test if a path is valid for document indexing
   */
  @Post('test-path')
  @ApiOperation({
    summary: 'Test document path validity',
    description:
      'Validates whether a given path can be used for document indexing, checking if it exists, is a directory, and contains valid documents.',
  })
  @ApiResponse({
    status: 200,
    description: 'Path validation completed',
    schema: {
      type: 'object',
      properties: {
        valid: {
          type: 'boolean',
          description: 'Whether the path is valid for indexing',
        },
        message: { type: 'string', description: 'Detailed validation message' },
        documentCount: {
          type: 'number',
          description: 'Number of valid documents found (if valid)',
        },
      },
    },
  })
  testPath(@Body() dto: TestPathDto): {
    valid: boolean;
    message: string;
    documentCount?: number;
  } {
    const result = this.akuriConfigService.testPath(dto.path);

    this.logger.info('Path tested', {
      context: 'ConfigController',
      operation: 'test_path',
      path: dto.path,
      valid: result.valid,
      documentCount: result.documentCount,
    });

    return result;
  }

  /**
   * Update all document paths (replace all)
   */
  @Post('paths/bulk')
  @ApiOperation({
    summary: 'Bulk update document paths',
    description:
      'Replaces all configured document paths with a new set. All paths are validated before the update is applied.',
  })
  @ApiResponse({
    status: 200,
    description: 'Document paths updated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'Configuration updated with 3 paths and 150 total documents',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Some paths are invalid',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Some paths are invalid' },
        invalidPaths: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of invalid paths with error messages',
        },
      },
    },
  })
  async updateDocumentPaths(
    @Body() dto: { paths: string[] },
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Validate all paths first
      const invalidPaths: string[] = [];
      let totalDocuments = 0;

      for (const path of dto.paths) {
        const testResult = this.akuriConfigService.testPath(path);
        if (!testResult.valid) {
          invalidPaths.push(`${path}: ${testResult.message}`);
        } else {
          totalDocuments += testResult.documentCount || 0;
        }
      }

      if (invalidPaths.length > 0) {
        throw new HttpException(
          {
            success: false,
            message: 'Some paths are invalid',
            invalidPaths,
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      await this.akuriConfigService.updateDocumentPaths(dto.paths);

      this.logger.info('Document paths updated in bulk', {
        context: 'ConfigController',
        operation: 'bulk_update',
        pathCount: dto.paths.length,
        totalDocuments,
      });

      return {
        success: true,
        message: `Configuration updated with ${dto.paths.length} paths and ${totalDocuments} total documents`,
      };
    } catch (error) {
      this.logger.error('Failed to update document paths in bulk', {
        context: 'ConfigController',
        operation: 'bulk_update',
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get allowed file extensions
   */
  @Get('extensions')
  @ApiOperation({
    summary: 'Get allowed file extensions',
    description:
      'Retrieves the list of file extensions that are allowed for document indexing.',
  })
  @ApiResponse({
    status: 200,
    description: 'Extensions retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        extensions: {
          type: 'array',
          items: { type: 'string' },
          example: ['.md', '.txt', '.markdown', '.rst', '.adoc', '.pdf'],
          description: 'List of allowed file extensions',
        },
      },
    },
  })
  getAllowedExtensions(): { extensions: string[] } {
    const extensions = this.akuriConfigService.getAllowedExtensions();
    this.logger.info('Extensions requested', {
      context: 'ConfigController',
      operation: 'get_extensions',
      count: extensions.length,
    });
    return { extensions };
  }

  /**
   * Update allowed file extensions
   */
  @Post('extensions')
  @ApiOperation({
    summary: 'Update allowed file extensions',
    description:
      'Updates the list of file extensions that are allowed for document indexing. Note: This feature is not yet fully implemented.',
  })
  @ApiResponse({
    status: 200,
    description: 'Extensions updated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'Extensions updated: .md, .txt, .pdf',
        },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Failed to update extensions',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Failed to update extensions' },
      },
    },
  })
  async updateExtensions(
    @Body() dto: { extensions: string[] },
  ): Promise<{ success: boolean; message: string }> {
    try {
      // TODO: Implement updateExtensions in ConfigService
      // For now, return success
      this.logger.info('Extensions updated', {
        context: 'ConfigController',
        operation: 'update_extensions',
        extensions: dto.extensions,
      });
      return {
        success: true,
        message: `Extensions updated: ${dto.extensions.join(', ')}`,
      };
    } catch (error) {
      this.logger.error('Failed to update extensions', {
        context: 'ConfigController',
        operation: 'update_extensions',
        error: error.message,
      });
      throw new HttpException(
        {
          success: false,
          message: 'Failed to update extensions',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get search metrics
   */
  @Get('metrics')
  @ApiOperation({
    summary: 'Get search metrics',
    description:
      'Retrieves search performance metrics and statistics. Note: This feature is not yet fully implemented.',
  })
  @ApiResponse({
    status: 200,
    description: 'Metrics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        searchCount: {
          type: 'number',
          description: 'Total number of searches performed',
          example: 0,
        },
        averageSearchTime: {
          type: 'number',
          description: 'Average search execution time in milliseconds',
          example: 0,
        },
        lastSearchTime: {
          type: 'number',
          description: 'Timestamp of the last search',
          example: 0,
        },
        documentsIndexed: {
          type: 'number',
          description: 'Total number of documents indexed',
          example: 0,
        },
      },
    },
  })
  getMetrics(): any {
    // TODO: Get metrics from LibrarianService
    this.logger.info('Metrics requested', {
      context: 'ConfigController',
      operation: 'get_metrics',
    });
    return {
      searchCount: 0,
      averageSearchTime: 0,
      lastSearchTime: 0,
      documentsIndexed: 0,
    };
  }

  /**
   * Update boost weights for hierarchical search
   */
  @Post('boost-weights')
  @ApiOperation({
    summary: 'Update search boost weights',
    description:
      'Updates the boost weights used for hierarchical search ranking. Note: This feature is not yet fully implemented.',
  })
  @ApiResponse({
    status: 200,
    description: 'Boost weights updated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'Boost weights updated successfully',
        },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Failed to update boost weights',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Failed to update boost weights' },
      },
    },
  })
  async updateBoostWeights(
    @Body()
    dto: {
      project: number;
      workspace: number;
      general: number;
      internal: number;
    },
  ): Promise<{ success: boolean; message: string }> {
    try {
      // TODO: Implement boost weights configuration
      this.logger.info('Boost weights updated', {
        context: 'ConfigController',
        operation: 'update_boost_weights',
        weights: dto,
      });
      return {
        success: true,
        message: 'Boost weights updated successfully',
      };
    } catch (error) {
      this.logger.error('Failed to update boost weights', {
        context: 'ConfigController',
        operation: 'update_boost_weights',
        error: error.message,
      });
      throw new HttpException(
        {
          success: false,
          message: 'Failed to update boost weights',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Trigger reindexation
   */
  @Post('reindex')
  @ApiOperation({
    summary: 'Trigger document reindexing',
    description:
      'Triggers a complete reindexing of all configured document paths. This operation may take some time depending on the number of documents.',
  })
  @ApiResponse({
    status: 200,
    description: 'Reindexing completed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        totalDocs: {
          type: 'number',
          example: 150,
          description: 'Total number of documents indexed',
        },
        message: {
          type: 'string',
          example: 'Reindexation completed: 150 documents',
        },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Reindexing failed',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        totalDocs: { type: 'number', example: 0 },
        message: { type: 'string', example: 'Failed to reindex documents' },
      },
    },
  })
  async reindex(): Promise<{
    success: boolean;
    totalDocs: number;
    message: string;
  }> {
    try {
      this.logger.info('Reindexation triggered', {
        context: 'ConfigController',
        operation: 'reindex',
      });

      const totalDocs = await this.librarianService.reindex();

      return {
        success: true,
        totalDocs,
        message: `Reindexation completed: ${totalDocs} documents`,
      };
    } catch (error) {
      this.logger.error('Failed to reindex', {
        context: 'ConfigController',
        operation: 'reindex',
        error: error.message,
      });
      throw new HttpException(
        {
          success: false,
          totalDocs: 0,
          message: 'Failed to reindex documents',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get dynamic installation configuration
   */
  @Get('install-config')
  @ApiOperation({
    summary: 'Get dynamic installation configuration',
    description:
      'Retrieves the current server configuration needed for MCP client installation and setup. This includes port, executable paths, and available tools.',
  })
  @ApiResponse({
    status: 200,
    description: 'Installation configuration retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        port: {
          type: 'number',
          example: 3001,
          description: 'Server port number',
        },
        localExecutablePath: {
          type: 'string',
          example: '/path/to/dist/main.js',
          description: 'Path to the compiled executable',
        },
        remoteSseUrl: {
          type: 'string',
          example: 'http://localhost:3001/mcp/sse-connect',
          description: 'SSE connection URL for MCP',
        },
        tools: {
          type: 'array',
          items: { type: 'string' },
          example: [
            'akuri_search_docs',
            'akuri_check_workflow',
            'akuri_generate_blueprint',
          ],
          description: 'List of available MCP tools',
        },
        lastUpdated: {
          type: 'string',
          format: 'date-time',
          description: 'Timestamp of last configuration update',
        },
      },
    },
  })
  getInstallConfig(): {
    port: number;
    localExecutablePath: string;
    remoteSseUrl: string;
    tools: string[];
    lastUpdated: string;
  } {
    const port = this.nestConfigService.get('PORT', 3001);
    const workspacePath = process.cwd();
    const executablePath = `${workspacePath}/dist/main.js`;

    const config = {
      port,
      localExecutablePath: executablePath,
      remoteSseUrl: `http://localhost:${port}/mcp/sse-connect`,
      tools: [
        'akuri_search_docs',
        'akuri_check_workflow',
        'akuri_generate_blueprint',
      ],
      lastUpdated: new Date().toISOString(),
    };

    this.logger.info('Installation config requested', {
      context: 'ConfigController',
      operation: 'get_install_config',
      port,
    });

    return config;
  }
}
