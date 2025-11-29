import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../../common/logger/logger.service';
import { LibrarianService } from './librarian.service';
import * as fs from 'fs';
import * as path from 'path';

// Mock fs and path
jest.mock('fs');
jest.mock('path');
jest.mock('chokidar', () => ({
  watch: jest.fn(() => ({
    on: jest.fn().mockReturnThis(),
  })),
}));

// Mock Orama functions
jest.mock('@orama/orama', () => ({
  create: jest.fn(() => ({
    count: jest.fn(),
    search: jest.fn(),
    insert: jest.fn(),
    remove: jest.fn(),
  })),
  count: jest.fn(),
  search: jest.fn(),
  insert: jest.fn(),
  remove: jest.fn(),
}));

// Import the mocked functions
const { count, search, insert, remove } = require('@orama/orama');

describe('LibrarianService', () => {
  let service: LibrarianService;
  let configService: ConfigService;
  let loggerService: LoggerService;
  let mockDb: any;

  const mockDocsPath = '/test/docs/path';

  beforeEach(async () => {
    mockDb = {
      count: jest.fn(),
      search: jest.fn(),
      insert: jest.fn(),
      remove: jest.fn(),
    };

    // Mock the create function to return our mock db
    const { create } = require('@orama/orama');
    create.mockReturnValue(mockDb);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LibrarianService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'AKURI_DOCS_PATH') return mockDocsPath;
              return undefined;
            }),
          },
        },
        {
          provide: LoggerService,
          useValue: {
            setContext: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            logSearch: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<LibrarianService>(LibrarianService);
    configService = module.get<ConfigService>(ConfigService);
    loggerService = module.get<LoggerService>(LoggerService);

    // Initialize the database manually for tests
    (service as any).initDB();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('constructor', () => {
    it('should throw error when AKURI_DOCS_PATH is not provided', () => {
      const configServiceWithoutPath = {
        get: jest.fn(() => undefined),
      };
      const mockLogger = {
        setContext: jest.fn(),
        info: jest.fn(),
        error: jest.fn(),
        logSearch: jest.fn(),
      };

      expect(() => {
        new LibrarianService(
          configServiceWithoutPath as any,
          mockLogger as any,
        );
      }).toThrow('AKURI_DOCS_PATH environment variable is required');
    });

    it('should initialize with valid AKURI_DOCS_PATH', () => {
      const mockLogger = {
        setContext: jest.fn(),
        info: jest.fn(),
        error: jest.fn(),
        logSearch: jest.fn(),
      };

      expect(() => {
        new LibrarianService(configService, mockLogger as any);
      }).not.toThrow();
    });

    it('should throw error when AKURI_DOCS_PATH is empty after parsing', () => {
      const configServiceWithEmptyPath = {
        get: jest.fn(() => '   ,   ,   '),
      };
      const mockLogger = {
        setContext: jest.fn(),
        info: jest.fn(),
        error: jest.fn(),
        logSearch: jest.fn(),
      };

      expect(() => {
        new LibrarianService(
          configServiceWithEmptyPath as any,
          mockLogger as any,
        );
      }).toThrow('At least one valid path must be provided in AKURI_DOCS_PATH');
    });

    it('should parse multiple paths separated by commas', () => {
      const configServiceWithMultiplePaths = {
        get: jest.fn(() => '/path1,/path2,/path3'),
      };
      const mockLogger = {
        setContext: jest.fn(),
        info: jest.fn(),
        error: jest.fn(),
        logSearch: jest.fn(),
      };

      const service = new LibrarianService(
        configServiceWithMultiplePaths as any,
        mockLogger as any,
      );

      expect((service as any).docsPaths).toEqual([
        '/path1',
        '/path2',
        '/path3',
      ]);
    });
  });

  describe('searchDocs', () => {
    beforeEach(() => {
      // Reset mocks
      count.mockReset();
      search.mockReset();

      // Mock the count function to return the database count
      count.mockImplementation((db: any) => db.count());
    });

    it('should return error when database is empty', async () => {
      mockDb.count.mockReturnValue(0);

      const result = await service.searchDocs('test query');

      expect(result).toHaveLength(1);
      expect(result[0].path).toBe('SISTEMA_VACIO');
      expect(result[0].metadata.status).toBe('error');
    });

    it('should perform search with valid query', async () => {
      mockDb.count.mockReturnValue(10);

      const mockSearchResult = {
        count: 1,
        hits: [
          {
            score: 0.8,
            document: {
              filepath: 'test.md',
              metadata: '{"title": "Test"}',
              content: 'Test content',
            },
          },
        ],
      };

      search.mockResolvedValue(mockSearchResult);

      const result = await service.searchDocs('test query', 5);

      expect(result).toHaveLength(1);
      expect(result[0].path).toBe('test.md');
      expect(result[0].score).toBe(0.8);
      expect(result[0].metadata).toEqual({ title: 'Test' });
      expect(result[0].snippet).toContain('Test content');
    });

    it('should return no results message when search yields no hits', async () => {
      mockDb.count.mockReturnValue(10);

      const mockSearchResult = {
        count: 0,
        hits: [],
      };

      search.mockResolvedValue(mockSearchResult);

      const result = await service.searchDocs('nonexistent query');

      expect(result).toHaveLength(1);
      expect(result[0].path).toBe('SIN_RESULTADOS');
    });

    it('should handle search errors gracefully', async () => {
      mockDb.count.mockReturnValue(10);
      search.mockRejectedValue(new Error('Search failed'));

      const result = await service.searchDocs('test query');

      expect(result).toHaveLength(1);
      expect(result[0].path).toBe('ERROR_INTERNO');
      expect(result[0].metadata.error).toBe('Search failed');
    });

    it('should use dump mode when query is "dump"', async () => {
      mockDb.count.mockReturnValue(10);

      const mockSearchResult = {
        count: 1,
        hits: [],
      };

      search.mockResolvedValue(mockSearchResult);

      await service.searchDocs('dump');

      expect(search).toHaveBeenCalledWith(mockDb, {
        term: '',
        limit: 5,
        properties: '*',
        threshold: 0,
      });
    });
  });

  describe('indexFile', () => {
    beforeEach(() => {
      // Reset mocks
      (fs.readFileSync as jest.Mock).mockReset();
      (path.relative as jest.Mock).mockReset();
      (path.basename as jest.Mock).mockReset();
      remove.mockReset();
      insert.mockReset();

      // Mock fs operations
      (fs.readFileSync as jest.Mock).mockReturnValue(
        '---\ntitle: Test\ntags: [test]\n---\nContent',
      );
      (path.relative as jest.Mock).mockReturnValue('test.md');
      (path.basename as jest.Mock).mockReturnValue('test.md');

      // Mock matter
      jest.mock('gray-matter', () => ({
        default: jest.fn(() => ({
          data: { title: 'Test', tags: ['test'] },
          content: 'Content',
        })),
      }));
    });

    it('should skip non-markdown files', async () => {
      await (service as any).indexFile('test.txt');

      expect(fs.readFileSync).not.toHaveBeenCalled();
    });

    it('should index markdown files successfully', async () => {
      const testFilePath = `${mockDocsPath}/test.md`;
      await (service as any).indexFile(testFilePath);

      expect(fs.readFileSync).toHaveBeenCalledWith(testFilePath, 'utf8');
      expect(remove).toHaveBeenCalledWith(mockDb, 'test.md');
      expect(insert).toHaveBeenCalledWith(mockDb, {
        id: 'test.md',
        filepath: 'test.md',
        content: 'Content',
        metadata: JSON.stringify({ title: 'Test', tags: ['test'] }),
        tags: 'test',
      });
    });

    it('should handle indexing errors gracefully', async () => {
      (fs.readFileSync as jest.Mock).mockImplementation(() => {
        throw new Error('File read error');
      });

      const testFilePath = `${mockDocsPath}/test.md`;
      await (service as any).indexFile(testFilePath);

      expect(loggerService.error).toHaveBeenCalledWith(
        'File indexing error: test.md',
        expect.objectContaining({
          operation: 'index_error',
          filePath: 'test.md',
          error: 'File read error',
        }),
      );
    });
  });
});
