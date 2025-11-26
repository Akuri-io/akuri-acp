import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as chokidar from 'chokidar';
import * as path from 'path';
import * as fs from 'fs';
import { PdfParser } from '../parsers/pdf.parser';
import { MarkdownGenerator } from '../generators/markdown.generator';

@Injectable()
export class DocumentIngestorService implements OnModuleInit {
  private readonly logger = new Logger(DocumentIngestorService.name);
  private watcher: chokidar.FSWatcher;

  constructor(
    private configService: ConfigService,
    private pdfParser: PdfParser,
    private markdownGenerator: MarkdownGenerator,
  ) {}

  onModuleInit() {
    this.startWatcher();
  }

  private startWatcher() {
    const docsPathConfig = this.configService.get<string>('AKURI_DOCS_PATH');
    if (!docsPathConfig) {
      this.logger.warn('AKURI_DOCS_PATH not set, ingestion watcher disabled');
      return;
    }

    const paths = docsPathConfig.split(',').map(p => p.trim()).filter(p => p.length > 0);
    
    // Default allowed extensions if not configured
    const allowedExts = this.configService.get<string>('AKURI_ALLOWED_EXTS', '.pdf').split(',');

    this.logger.log(`Starting ingestion watcher on: ${paths.join(', ')} for extensions: ${allowedExts.join(', ')}`);

    this.watcher = chokidar.watch(paths, {
      ignored: /(^|[/\\])\../, // ignore dotfiles
      persistent: true,
      ignoreInitial: false, // Process existing files too
      depth: 5,
    });

    this.watcher.on('add', (filePath) => this.handleFile(filePath, allowedExts));
    this.watcher.on('change', (filePath) => this.handleFile(filePath, allowedExts));
  }

  private async handleFile(filePath: string, allowedExts: string[]) {
    const ext = path.extname(filePath).toLowerCase();
    
    // Skip if not allowed extension or if it's already a markdown file (we don't ingest MD files, Librarian reads them)
    if (!allowedExts.includes(ext) || ext === '.md') {
      return;
    }

    this.logger.log(`Processing new file: ${filePath}`);

    try {
      let content = '';
      
      if (ext === '.pdf') {
        content = await this.pdfParser.parse(filePath);
      } else {
        this.logger.warn(`Unsupported extension for ingestion: ${ext}`);
        return;
      }

      // Generate Markdown
      const mdContent = this.markdownGenerator.generate({
        content,
        originalPath: filePath,
      });

      // Save as .md in the same directory (shadow file)
      // Strategy: file.pdf -> file.pdf.md
      const mdPath = `${filePath}.md`;
      fs.writeFileSync(mdPath, mdContent);
      
      this.logger.log(`Generated shadow markdown: ${mdPath}`);

    } catch (error) {
      this.logger.error(`Error ingesting file ${filePath}: ${error.message}`, error.stack);
    }
  }
}
