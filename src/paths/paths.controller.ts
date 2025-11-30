import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { PathsService } from './paths.service';
import { LibrarianService } from '../akuri-core/librarian/librarian.service';
import {
  CreatePathDto,
  UpdatePathDto,
  PathsResponse,
  PathResponse,
  DeleteResponse,
  ValidationResponse,
} from './dto';

@ApiTags('Paths Management')
@Controller('paths')
export class PathsController {
  constructor(
    private readonly pathsService: PathsService,
    private readonly librarianService: LibrarianService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all paths' })
  @ApiResponse({
    status: 200,
    description: 'Paths retrieved successfully',
    type: PathsResponse,
  })
  async getAllPaths(): Promise<PathsResponse> {
    try {
      const allPaths = await this.pathsService.loadPaths();
      const envPaths = allPaths
        .filter((p) => p.id.startsWith('env-'))
        .map((p) => p.path);
      const dynamicPaths = allPaths.filter((p) => !p.id.startsWith('env-'));

      return {
        success: true,
        data: {
          envPaths,
          dynamicPaths,
          total: allPaths.length,
        },
        message: 'Paths retrieved successfully',
        timestamp: new Date().toISOString(),
      };
    } catch {
      throw new HttpException(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to retrieve paths',
          },
          timestamp: new Date().toISOString(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post()
  @ApiOperation({ summary: 'Create a new dynamic path' })
  @ApiBody({ type: CreatePathDto })
  @ApiResponse({
    status: 201,
    description: 'Path created successfully',
    type: PathResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed',
  })
  @ApiResponse({
    status: 409,
    description: 'Path name already exists',
  })
  async createPath(@Body() dto: CreatePathDto): Promise<PathResponse> {
    try {
      const path = await this.pathsService.createPath(dto);
      // Reload paths in LibrarianService to include the new path (silent to avoid MCP interference)
      await this.librarianService.reloadPaths(true);
      return {
        success: true,
        data: path,
        message: 'Path created successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      if (message.includes('already exists')) {
        throw new HttpException(
          {
            success: false,
            error: {
              code: 'CONFLICT',
              message,
            },
            timestamp: new Date().toISOString(),
          },
          HttpStatus.CONFLICT,
        );
      }
      throw new HttpException(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message,
          },
          timestamp: new Date().toISOString(),
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing dynamic path' })
  @ApiParam({ name: 'id', description: 'Path ID' })
  @ApiBody({ type: UpdatePathDto })
  @ApiResponse({
    status: 200,
    description: 'Path updated successfully',
    type: PathResponse,
  })
  @ApiResponse({
    status: 404,
    description: 'Path not found',
  })
  async updatePath(
    @Param('id') id: string,
    @Body() dto: UpdatePathDto,
  ): Promise<PathResponse> {
    try {
      const path = await this.pathsService.updatePath(id, dto);
      // Reload paths in LibrarianService to reflect changes (silent to avoid MCP interference)
      await this.librarianService.reloadPaths(true);
      return {
        success: true,
        data: path,
        message: 'Path updated successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      if (message.includes('not found')) {
        throw new HttpException(
          {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message,
            },
            timestamp: new Date().toISOString(),
          },
          HttpStatus.NOT_FOUND,
        );
      }
      throw new HttpException(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message,
          },
          timestamp: new Date().toISOString(),
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a dynamic path' })
  @ApiParam({ name: 'id', description: 'Path ID' })
  @ApiResponse({
    status: 200,
    description: 'Path deleted successfully',
    type: DeleteResponse,
  })
  @ApiResponse({
    status: 404,
    description: 'Path not found',
  })
  async deletePath(@Param('id') id: string): Promise<DeleteResponse> {
    try {
      await this.pathsService.deletePath(id);
      // Reload paths in LibrarianService to remove the deleted path (silent to avoid MCP interference)
      await this.librarianService.reloadPaths(true);
      return {
        success: true,
        message: 'Path deleted successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      if (message.includes('not found')) {
        throw new HttpException(
          {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message,
            },
            timestamp: new Date().toISOString(),
          },
          HttpStatus.NOT_FOUND,
        );
      }
      throw new HttpException(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to delete path',
          },
          timestamp: new Date().toISOString(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('validate')
  @ApiOperation({ summary: 'Validate a path' })
  @ApiBody({
    schema: { type: 'object', properties: { path: { type: 'string' } } },
  })
  @ApiResponse({
    status: 200,
    description: 'Path validation result',
    type: ValidationResponse,
  })
  async validatePath(
    @Body() body: { path: string },
  ): Promise<ValidationResponse> {
    try {
      const result = await this.pathsService.validatePath(body.path);
      const message = result.valid
        ? `Path is valid and accessible (Read: ${result.permissions.canRead}, Write: ${result.permissions.canWrite}, Execute: ${result.permissions.canExecute})`
        : 'Path is not valid or accessible';

      return {
        success: true,
        valid: result.valid,
        permissions: result.permissions,
        message,
        timestamp: new Date().toISOString(),
      };
    } catch {
      throw new HttpException(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to validate path',
          },
          timestamp: new Date().toISOString(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
