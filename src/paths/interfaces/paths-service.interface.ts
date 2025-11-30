import { PathEntity } from '../entities/path.entity';
import { CreatePathDto } from '../dto/create-path.dto';
import { UpdatePathDto } from '../dto/update-path.dto';

export interface IPathsService {
  loadPaths(): Promise<PathEntity[]>;
  savePaths(paths: PathEntity[]): Promise<void>;
  createPath(dto: CreatePathDto): Promise<PathEntity>;
  updatePath(id: string, dto: UpdatePathDto): Promise<PathEntity>;
  deletePath(id: string): Promise<void>;
  validatePath(
    path: string,
  ): Promise<{
    valid: boolean;
    permissions: {
      canRead: boolean;
      canWrite: boolean;
      canExecute: boolean;
      permissions: string;
    };
  }>;
}
