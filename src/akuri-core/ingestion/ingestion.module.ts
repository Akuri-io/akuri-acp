import { Module } from '@nestjs/common';
import { DocumentIngestorService } from './document-ingestor/document-ingestor.service';
import { PdfParser } from './parsers/pdf.parser';
import { MarkdownGenerator } from './generators/markdown.generator';

@Module({
  providers: [DocumentIngestorService, PdfParser, MarkdownGenerator],
  exports: [DocumentIngestorService],
})
export class IngestionModule {}
