import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { PathEntity } from './entities/path.entity';
import { CreatePathDto } from './dto/create-path.dto';
import { UpdatePathDto } from './dto/update-path.dto';
import { IPathsService } from './interfaces/paths-service.interface';

@Injectable()
export class PathsService implements IPathsService {
  private readonly logger = new Logger(PathsService.name);
  private readonly pathsFilePath: string;
  private readonly envPaths: string[];
  private pathsCache: PathEntity[] = [];
  private lastModified: Date = new Date();

  constructor(private configService: ConfigService) {
    this.pathsFilePath = join(process.cwd(), 'public', 'paths', 'paths.json');
    const envPathsStr = this.configService.get<string>('AKURI_DOCS_PATH', '');
    this.envPaths = envPathsStr
      ? envPathsStr.split(',').map((p) => p.trim())
      : [];
    this.logger.log(
      `Initialized with ${this.envPaths.length} env paths and file: ${this.pathsFilePath}`,
    );
  }

  async loadPaths(): Promise<PathEntity[]> {
    try {
      // Load dynamic paths from JSON file
      let dynamicPaths: PathEntity[] = [];
      try {
        const fileContent = await fs.readFile(this.pathsFilePath, 'utf-8');
        dynamicPaths = JSON.parse(fileContent) as PathEntity[];
        this.pathsCache = dynamicPaths;
        this.lastModified = new Date();
      } catch (error) {
        if (
          error instanceof Error &&
          'code' in error &&
          error.code !== 'ENOENT'
        ) {
          this.logger.error(`Error reading paths file: ${error.message}`);
        }
        // File doesn't exist, start with empty array
        dynamicPaths = [];
      }

      // Combine with env paths (converted to PathEntity format for consistency)
      const combinedPaths = [
        ...this.envPaths.map((path) => ({
          id: `env-${path.replace(/[^a-zA-Z0-9]/g, '-')}`,
          name: `ENV: ${path.split('/').pop() || path}`,
          path,
          description: 'Ruta fija desde .env',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        })),
        ...dynamicPaths,
      ];

      return combinedPaths;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error loading paths: ${message}`);
      throw error;
    }
  }

  async savePaths(paths: PathEntity[]): Promise<void> {
    try {
      // Only save dynamic paths (exclude env paths)
      const dynamicPaths = paths.filter((path) => !path.id.startsWith('env-'));

      // Ensure directory exists
      const dir = join(process.cwd(), 'public', 'paths');
      await fs.mkdir(dir, { recursive: true });

      // Write to file atomically
      const tempFile = `${this.pathsFilePath}.tmp`;
      await fs.writeFile(tempFile, JSON.stringify(dynamicPaths, null, 2));
      await fs.rename(tempFile, this.pathsFilePath);

      this.pathsCache = dynamicPaths;
      this.lastModified = new Date();

      this.logger.log(`Saved ${dynamicPaths.length} dynamic paths to file`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error saving paths: ${message}`);
      throw error;
    }
  }

  async createPath(dto: CreatePathDto): Promise<PathEntity> {
    const paths = await this.loadPaths();

    // Check for duplicate name
    const existingPath = paths.find(
      (p) => p.name === dto.name && !p.id.startsWith('env-'),
    );
    if (existingPath) {
      throw new Error(`Path with name '${dto.name}' already exists`);
    }

    const newPath: PathEntity = {
      id: uuidv4(),
      name: dto.name,
      path: dto.path,
      description: dto.description,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    paths.push(newPath);
    await this.savePaths(paths);

    this.logger.log(`Created new path: ${newPath.name}`);
    return newPath;
  }

  async updatePath(id: string, dto: UpdatePathDto): Promise<PathEntity> {
    const paths = await this.loadPaths();
    const pathIndex = paths.findIndex(
      (p) => p.id === id && !p.id.startsWith('env-'),
    );

    if (pathIndex === -1) {
      throw new Error(`Path with id '${id}' not found`);
    }

    // Check for duplicate name if name is being updated
    if (dto.name && dto.name !== paths[pathIndex].name) {
      const existingPath = paths.find(
        (p) => p.name === dto.name && p.id !== id && !p.id.startsWith('env-'),
      );
      if (existingPath) {
        throw new Error(`Path with name '${dto.name}' already exists`);
      }
    }

    // Update the path
    const updatedPath = {
      ...paths[pathIndex],
      ...dto,
      updatedAt: new Date(),
    };

    paths[pathIndex] = updatedPath;
    await this.savePaths(paths);

    this.logger.log(`Updated path: ${updatedPath.name}`);
    return updatedPath;
  }

  async deletePath(id: string): Promise<void> {
    const paths = await this.loadPaths();
    const filteredPaths = paths.filter((p) => p.id !== id);

    if (filteredPaths.length === paths.length) {
      throw new Error(`Path with id '${id}' not found`);
    }

    await this.savePaths(filteredPaths);
    this.logger.log(`Deleted path with id: ${id}`);
  }

  async validatePath(path: string): Promise<boolean> {
    try {
      await fs.access(path);
      return true;
    } catch {
      return false;
    }
  }
}
