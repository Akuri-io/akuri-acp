import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
const pdf = require('pdf-parse');

@Injectable()
export class PdfParser {
  private readonly logger = new Logger(PdfParser.name);

  async parse(filePath: string): Promise<string> {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdf(dataBuffer);

      // Basic cleanup of extracted text
      return this.cleanText(data.text);
    } catch (error) {
      this.logger.error(
        `Error parsing PDF ${filePath}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private cleanText(text: string): string {
    // Remove excessive newlines and weird control characters
    return text
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n') // Max 2 newlines
      .trim();
  }
}
