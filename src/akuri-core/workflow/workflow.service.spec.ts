import { Test, TestingModule } from '@nestjs/testing';
import { WorkflowService } from './workflow.service';
import { LibrarianService } from '../librarian/librarian.service';
import { LoggerService } from '../../common/logger/logger.service';

describe('WorkflowService', () => {
  let service: WorkflowService;
  let librarianService: LibrarianService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkflowService,
        {
          provide: LibrarianService,
          useValue: {
            searchDocs: jest.fn(),
          },
        },
        {
          provide: LoggerService,
          useValue: {
            setContext: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            debug: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<WorkflowService>(WorkflowService);
    librarianService = module.get<LibrarianService>(LibrarianService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateWorkflow', () => {
    it('should allow AUDIT without requirements', async () => {
      const result = await service.validateWorkflow('AUDIT', 'test context');

      expect(result.allowed).toBe(true);
      expect(result.missing).toEqual([]);
      expect(result.context).toEqual([]);
    });

    it('should validate PLAN workflow correctly', async () => {
      const mockSearchResult = [
        {
          path: 'DESIGN.test-context.md',
          score: 0.9,
          metadata: { type: 'DESIGN' },
          snippet: 'Design document content',
          source_type: 'general',
        },
      ];

      jest
        .spyOn(librarianService, 'searchDocs')
        .mockResolvedValue(mockSearchResult);

      const result = await service.validateWorkflow('PLAN', 'test context');

      expect(result.allowed).toBe(true);
      expect(result.message).toContain('Protocolo AKURI Validado');
      expect(result.context).toEqual(mockSearchResult);
    });

    it('should validate BUILD workflow with both DESIGN and PLAN', async () => {
      const mockSearchResults = [
        {
          path: 'DESIGN.test-context.md',
          score: 0.9,
          metadata: { type: 'DESIGN' },
          snippet: 'Design document',
          source_type: 'general',
        },
        {
          path: 'PLAN.test-context.md',
          score: 0.8,
          metadata: { type: 'PLAN' },
          snippet: 'Plan document',
          source_type: 'general',
        },
      ];

      jest
        .spyOn(librarianService, 'searchDocs')
        .mockResolvedValueOnce([mockSearchResults[0]]) // DESIGN search
        .mockResolvedValueOnce([mockSearchResults[1]]); // PLAN search

      const result = await service.validateWorkflow('BUILD', 'test context');

      expect(result.allowed).toBe(true);
      expect(result.context).toHaveLength(2);
    });

    it('should reject BUILD when PLAN is missing', async () => {
      const mockDesignResult = [
        {
          path: 'DESIGN.test-context.md',
          score: 0.9,
          metadata: { type: 'DESIGN' },
          snippet: 'Design document',
          source_type: 'general',
        },
      ];

      const mockEmptyResult: any[] = [];

      jest
        .spyOn(librarianService, 'searchDocs')
        .mockResolvedValueOnce(mockDesignResult) // DESIGN found
        .mockResolvedValueOnce(mockEmptyResult); // PLAN not found

      const result = await service.validateWorkflow('BUILD', 'test context');

      expect(result.allowed).toBe(false);
      expect(result.missing).toEqual(['PLAN']);
      expect(result.error).toContain('BLOQUEO DE METODOLOGÍA AKURI');
    });

    it('should validate REFACTOR workflow with AUDIT requirement', async () => {
      const mockAuditResult = [
        {
          path: 'AUDIT.test-context.md',
          score: 0.9,
          metadata: { type: 'AUDIT' },
          snippet: 'Audit document',
          source_type: 'general',
        },
      ];

      jest
        .spyOn(librarianService, 'searchDocs')
        .mockResolvedValue(mockAuditResult);

      const result = await service.validateWorkflow('REFACTOR', 'test context');

      expect(result.allowed).toBe(true);
      expect(result.context).toEqual(mockAuditResult);
    });

    it('should handle invalid intent gracefully', async () => {
      const result = await service.validateWorkflow(
        'INVALID' as any,
        'test context',
      );

      expect(result.allowed).toBe(true);
      expect(result.missing).toEqual([]);
    });

    it('should search for documents with correct query format', async () => {
      const mockSearchResult = [
        {
          path: 'DESIGN.login-auth.md',
          score: 0.9,
          metadata: { type: 'DESIGN' },
          snippet: 'Design content',
          source_type: 'general',
        },
      ];

      const searchSpy = jest
        .spyOn(librarianService, 'searchDocs')
        .mockResolvedValue(mockSearchResult);

      await service.validateWorkflow('PLAN', 'login auth');

      expect(searchSpy).toHaveBeenCalledWith('DESIGN login auth', 10);
    });

    it('should match documents by path containing requirement type', async () => {
      const mockSearchResult = [
        {
          path: 'some/DESIGN.login-system.md',
          score: 0.9,
          metadata: { type: 'DESIGN' },
          snippet: 'Design content',
          source_type: 'general',
        },
      ];

      jest
        .spyOn(librarianService, 'searchDocs')
        .mockResolvedValue(mockSearchResult);

      const result = await service.validateWorkflow('PLAN', 'login system');

      expect(result.allowed).toBe(true);
    });

    it('should reject when document path does not contain requirement type', async () => {
      const mockSearchResult = [
        {
          path: 'some/other-document.md',
          score: 0.9,
          metadata: { type: 'OTHER' },
          snippet: 'Other content',
          source_type: 'general',
        },
      ];

      jest
        .spyOn(librarianService, 'searchDocs')
        .mockResolvedValue(mockSearchResult);

      const result = await service.validateWorkflow('PLAN', 'test context');

      expect(result.allowed).toBe(false);
      expect(result.missing).toEqual(['DESIGN']);
    });
  });
});
