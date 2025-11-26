import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as matter from 'gray-matter';

export interface MarkdownOptions {
  content: string;
  originalPath: string;
  summary?: string;
  tags?: string[];
}

@Injectable()
export class MarkdownGenerator {
  generate(options: MarkdownOptions): string {
    const { content, originalPath, summary, tags } = options;
    
    const filename = path.basename(originalPath);
    const extension = path.extname(originalPath).replace('.', '');
    
    const frontmatter = {
      original_file: filename,
      source_format: extension,
      generated_at: new Date().toISOString(),
      summary: summary || this.generateBasicSummary(content),
      tags: tags || ['auto-generated', extension],
    };

    return matter.stringify(content, frontmatter);
  }

  private generateBasicSummary(content: string): string {
    // Take first 500 chars as basic summary if no AI summary provided
    return content.substring(0, 500).replace(/\n/g, ' ') + '...';
  }
}
