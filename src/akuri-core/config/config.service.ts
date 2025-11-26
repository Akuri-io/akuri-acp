import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { LoggerService } from '../../common/logger/logger.service';

export interface DocumentPath {
  path: string;
  exists: boolean;
  isDirectory: boolean;
  documentCount?: number;
  lastIndexed?: Date;
}

export interface ConfigStatus {
  paths: DocumentPath[];
  totalDocuments: number;
  lastUpdated: Date;
}

@Injectable()
export class AkuriConfigService {
  constructor(
    private configService: NestConfigService,
    private logger: LoggerService,
  ) {}

  /**
    * Get current document paths from environment
    */
  getDocumentPaths(): string[] {
    // Always include the internal documentation path
    const internalDocsPath = path.join(process.cwd(), 'akuri-acp-documents');
    const paths = [internalDocsPath];

    // Add paths from environment variable
    const pathsConfig = this.configService.get<string>('AKURI_DOCS_PATH', '');
    if (pathsConfig.trim()) {
      const envPaths = pathsConfig.split(',').map(p => p.trim()).filter(p => p.length > 0);
      paths.push(...envPaths);
    }

    return paths;
  }

  /**
    * Update document paths in environment file
    */
  async updateDocumentPaths(paths: string[]): Promise<void> {
    const envPath = path.join(process.cwd(), '.env');
    const envContent = fs.readFileSync(envPath, 'utf-8');

    // The internal docs path is always included, so filter it out when saving to .env
    const internalDocsPath = path.join(process.cwd(), 'akuri-acp-documents');
    const externalPaths = paths.filter(p => p !== internalDocsPath && p.trim().length > 0);

    // Update or add AKURI_DOCS_PATH with only external paths
    const newPathsValue = externalPaths.join(',');
    let updatedContent = envContent;

    if (envContent.includes('AKURI_DOCS_PATH=')) {
      // Replace existing line
      updatedContent = envContent.replace(
        /AKURI_DOCS_PATH=.*/,
        `AKURI_DOCS_PATH=${newPathsValue}`
      );
    } else {
      // Add new line
      updatedContent += `\nAKURI_DOCS_PATH=${newPathsValue}`;
    }

    fs.writeFileSync(envPath, updatedContent);

    this.logger.info('Document paths updated', {
      context: 'ConfigService',
      operation: 'update_paths',
      internalPath: internalDocsPath,
      externalPaths: externalPaths
    });
  }

  /**
   * Add a new document path
   */
  async addDocumentPath(newPath: string): Promise<void> {
    const currentPaths = this.getDocumentPaths();
    if (!currentPaths.includes(newPath)) {
      currentPaths.push(newPath);
      await this.updateDocumentPaths(currentPaths);
    }
  }

  /**
   * Remove a document path
   */
  async removeDocumentPath(pathToRemove: string): Promise<void> {
    const currentPaths = this.getDocumentPaths();
    const filteredPaths = currentPaths.filter(p => p !== pathToRemove);
    await this.updateDocumentPaths(filteredPaths);
  }

  /**
   * Validate if a path exists and is a directory
   */
  validatePath(docPath: string): { exists: boolean; isDirectory: boolean; error?: string } {
    try {
      const stats = fs.statSync(docPath);
      return {
        exists: true,
        isDirectory: stats.isDirectory(),
        error: stats.isDirectory() ? undefined : 'Path is not a directory'
      };
    } catch (error) {
      return {
        exists: false,
        isDirectory: false,
        error: `Path does not exist: ${error.message}`
      };
    }
  }

  /**
   * Count documents in a directory (recursive)
   */
  countDocumentsInPath(docPath: string): number {
    try {
      let count = 0;
      const items = fs.readdirSync(docPath);

      for (const item of items) {
        const fullPath = path.join(docPath, item);
        const stats = fs.statSync(fullPath);

        if (stats.isDirectory()) {
          count += this.countDocumentsInPath(fullPath);
        } else if (stats.isFile() && this.isDocumentFile(item)) {
          count++;
        }
      }

      return count;
    } catch (error) {
      this.logger.warn(`Error counting documents in ${docPath}`, {
        context: 'ConfigService',
        operation: 'count_docs',
        error: error.message
      });
      return 0;
    }
  }

  /**
   * Get allowed file extensions for documents
   */
  getAllowedExtensions(): string[] {
    const defaultExts = ['.md', '.txt', '.markdown', '.rst', '.adoc', '.pdf'];
    const extsConfig = this.configService.get<string>('AKURI_ALLOWED_EXTS', '');
    
    if (extsConfig.trim()) {
      return extsConfig.split(',').map(e => e.trim().toLowerCase()).filter(e => e.length > 0);
    }
    
    return defaultExts;
  }

  /**
   * Check if file is a document (markdown, text, etc.)
   */
  private isDocumentFile(filename: string): boolean {
    const documentExtensions = this.getAllowedExtensions();
    const ext = path.extname(filename).toLowerCase();
    return documentExtensions.includes(ext);
  }

  /**
   * Get detailed status of all configured paths
   */
  getConfigStatus(): ConfigStatus {
    const paths = this.getDocumentPaths();
    const pathDetails: DocumentPath[] = [];
    let totalDocuments = 0;

    for (const docPath of paths) {
      const validation = this.validatePath(docPath);
      const documentCount = validation.exists && validation.isDirectory
        ? this.countDocumentsInPath(docPath)
        : 0;

      pathDetails.push({
        path: docPath,
        exists: validation.exists,
        isDirectory: validation.isDirectory,
        documentCount,
        lastIndexed: new Date() // TODO: Track actual indexing time
      });

      totalDocuments += documentCount;
    }

    return {
      paths: pathDetails,
      totalDocuments,
      lastUpdated: new Date()
    };
  }

  /**
   * Test a path to see if it's valid for document indexing
   */
  testPath(docPath: string): { valid: boolean; message: string; documentCount?: number } {
    const validation = this.validatePath(docPath);

    if (!validation.exists) {
      return { valid: false, message: validation.error || 'Path does not exist' };
    }

    if (!validation.isDirectory) {
      return { valid: false, message: 'Path is not a directory' };
    }

    const documentCount = this.countDocumentsInPath(docPath);
    if (documentCount === 0) {
      return { valid: false, message: 'No document files found in directory' };
    }

    return {
      valid: true,
      message: `Valid directory with ${documentCount} document(s)`,
      documentCount
    };
  }
}