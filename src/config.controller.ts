import { Controller, Get, Post, Delete, Body, Param, HttpException, HttpStatus } from '@nestjs/common';
import { AkuriConfigService } from './akuri-core/config/config.service';
import { LoggerService } from './common/logger/logger.service';

interface AddPathDto {
  path: string;
}

interface TestPathDto {
  path: string;
}

@Controller('config')
export class ConfigController {
  constructor(
    private configService: AkuriConfigService,
    private logger: LoggerService,
  ) {}

  /**
   * Get current configuration status
   */
  @Get('status')
  getConfigStatus(): { isInitialized: boolean; documentCount: number; paths: string[]; lastIndexed?: Date } {
    this.logger.info('Configuration status requested', {
      context: 'ConfigController',
      operation: 'get_status'
    });

    const status = this.configService.getConfigStatus();
    return {
      isInitialized: status.paths.length > 0,
      documentCount: status.totalDocuments,
      paths: status.paths.map(p => p.path),
      lastIndexed: status.lastUpdated
    };
  }

  /**
   * Get current document paths
   */
  @Get('paths')
  getDocumentPaths(): { paths: string[] } {
    const paths = this.configService.getDocumentPaths();
    this.logger.info('Document paths requested', {
      context: 'ConfigController',
      operation: 'get_paths',
      pathCount: paths.length
    });
    return { paths };
  }

  /**
   * Add a new document path
   */
  @Post('paths')
  async addDocumentPath(@Body() dto: AddPathDto): Promise<{ success: boolean; message: string }> {
    try {
      const testResult = this.configService.testPath(dto.path);

      if (!testResult.valid) {
        throw new HttpException({
          success: false,
          message: testResult.message
        }, HttpStatus.BAD_REQUEST);
      }

      await this.configService.addDocumentPath(dto.path);

      this.logger.info('Document path added', {
        context: 'ConfigController',
        operation: 'add_path',
        path: dto.path,
        documentCount: testResult.documentCount
      });

      return {
        success: true,
        message: `Path added successfully with ${testResult.documentCount} documents`
      };
    } catch (error) {
      this.logger.error('Failed to add document path', {
        context: 'ConfigController',
        operation: 'add_path',
        path: dto.path,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Remove a document path
   */
  @Delete('paths/:path')
  async removeDocumentPath(@Param('path') path: string): Promise<{ success: boolean; message: string }> {
    try {
      // URL decode the path parameter
      const decodedPath = decodeURIComponent(path);

      await this.configService.removeDocumentPath(decodedPath);

      this.logger.info('Document path removed', {
        context: 'ConfigController',
        operation: 'remove_path',
        path: decodedPath
      });

      return {
        success: true,
        message: 'Path removed successfully'
      };
    } catch (error) {
      this.logger.error('Failed to remove document path', {
        context: 'ConfigController',
        operation: 'remove_path',
        path,
        error: error.message
      });
      throw new HttpException({
        success: false,
        message: 'Failed to remove path'
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Test if a path is valid for document indexing
   */
  @Post('test-path')
  testPath(@Body() dto: TestPathDto): { valid: boolean; message: string; documentCount?: number } {
    const result = this.configService.testPath(dto.path);

    this.logger.info('Path tested', {
      context: 'ConfigController',
      operation: 'test_path',
      path: dto.path,
      valid: result.valid,
      documentCount: result.documentCount
    });

    return result;
  }

  /**
   * Update all document paths (replace all)
   */
  @Post('paths/bulk')
  async updateDocumentPaths(@Body() dto: { paths: string[] }): Promise<{ success: boolean; message: string }> {
    try {
      // Validate all paths first
      const invalidPaths: string[] = [];
      let totalDocuments = 0;

      for (const path of dto.paths) {
        const testResult = this.configService.testPath(path);
        if (!testResult.valid) {
          invalidPaths.push(`${path}: ${testResult.message}`);
        } else {
          totalDocuments += testResult.documentCount || 0;
        }
      }

      if (invalidPaths.length > 0) {
        throw new HttpException({
          success: false,
          message: 'Some paths are invalid',
          invalidPaths
        }, HttpStatus.BAD_REQUEST);
      }

      await this.configService.updateDocumentPaths(dto.paths);

      this.logger.info('Document paths updated in bulk', {
        context: 'ConfigController',
        operation: 'bulk_update',
        pathCount: dto.paths.length,
        totalDocuments
      });

      return {
        success: true,
        message: `Configuration updated with ${dto.paths.length} paths and ${totalDocuments} total documents`
      };
    } catch (error) {
      this.logger.error('Failed to update document paths in bulk', {
        context: 'ConfigController',
        operation: 'bulk_update',
        error: error.message
      });
      throw error;
    }
  }
}