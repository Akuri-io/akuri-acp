import { Test, TestingModule } from '@nestjs/testing';
import { DocumentIngestorService } from './document-ingestor.service';

describe('DocumentIngestorService', () => {
  let service: DocumentIngestorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DocumentIngestorService],
    }).compile();

    service = module.get<DocumentIngestorService>(DocumentIngestorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
