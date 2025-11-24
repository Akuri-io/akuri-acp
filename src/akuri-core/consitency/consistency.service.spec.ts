import { Test, TestingModule } from '@nestjs/testing';
import { ConsistencyService } from './consistency.service';
import { LibrarianService } from '../librarian/librarian.service';
import { LoggerService } from '../../common/logger/logger.service';

describe('ConsistencyService', () => {
  let service: ConsistencyService;
  let librarianService: LibrarianService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConsistencyService,
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

    service = module.get<ConsistencyService>(ConsistencyService);
    librarianService = module.get<LibrarianService>(LibrarianService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateFromBlueprint', () => {
    it('should return error when blueprint is not found', async () => {
      jest.spyOn(librarianService, 'searchDocs').mockResolvedValue([]);

      const result = await service.generateFromBlueprint(
        'nonexistent-blueprint',
        { key: 'value' },
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('No encontré ningún archivo Blueprint');
    });

    it('should generate prompt successfully when blueprint is found', async () => {
      const mockBlueprintDoc = {
        path: 'BLUEPRINT.datatable.md',
        score: 0.9,
        metadata: { type: 'BLUEPRINT' },
        snippet: 'Create a table with {{entity}} and columns: {{columns}}',
      };

      jest
        .spyOn(librarianService, 'searchDocs')
        .mockResolvedValue([mockBlueprintDoc]);

      const variables = { entity: 'User', columns: 'name,email' };
      const result = await service.generateFromBlueprint(
        'datatable',
        variables,
      );

      expect(result.success).toBe(true);
      expect(result.prompt).toContain('# 🏗️ AKURI GENERATED PROMPT');
      expect(result.prompt).toContain('BLUEPRINT.datatable.md');
      expect(result.prompt).toContain(
        'Create a table with User and columns: name,email',
      );
      expect(result.prompt).toContain('Return ONLY the code. No chatter.');
    });

    it('should search for blueprint with correct query', async () => {
      const searchSpy = jest
        .spyOn(librarianService, 'searchDocs')
        .mockResolvedValue([]);

      await service.generateFromBlueprint('datatable', {});

      expect(searchSpy).toHaveBeenCalledWith('BLUEPRINT datatable', 5);
    });

    it('should filter blueprints by path containing BLUEPRINT', async () => {
      const mockDocs = [
        {
          path: 'BLUEPRINT.datatable.md',
          score: 0.9,
          metadata: { type: 'BLUEPRINT' },
          snippet: 'Blueprint content',
        },
        {
          path: 'other-document.md',
          score: 0.8,
          metadata: { type: 'OTHER' },
          snippet: 'Other content',
        },
      ];

      jest.spyOn(librarianService, 'searchDocs').mockResolvedValue(mockDocs);

      const result = await service.generateFromBlueprint('datatable', {});

      expect(result.success).toBe(true);
      expect(result.prompt).toContain('Blueprint content');
    });

    it('should replace template variables in blueprint content', async () => {
      const mockBlueprintDoc = {
        path: 'BLUEPRINT.form.md',
        score: 0.9,
        metadata: { type: 'BLUEPRINT' },
        snippet:
          'Create {{componentType}} component for {{entity}} with {{fields}}',
      };

      jest
        .spyOn(librarianService, 'searchDocs')
        .mockResolvedValue([mockBlueprintDoc]);

      const variables = {
        componentType: 'reactive',
        entity: 'User',
        fields: 'name,email,password',
      };

      const result = await service.generateFromBlueprint('form', variables);

      expect(result.success).toBe(true);
      expect(result.prompt).toContain(
        'Create reactive component for User with name,email,password',
      );
    });

    it('should include guardrails in the generated prompt', async () => {
      const mockBlueprintDoc = {
        path: 'BLUEPRINT.service.md',
        score: 0.9,
        metadata: { type: 'BLUEPRINT' },
        snippet: 'Create service for {{entity}}',
      };

      const mockGuardrailsDoc = {
        path: 'GUIDELINES.naming.md',
        score: 0.8,
        metadata: { type: 'GUIDELINES' },
        snippet: 'Naming conventions content',
      };

      jest
        .spyOn(librarianService, 'searchDocs')
        .mockResolvedValueOnce([mockBlueprintDoc]) // Blueprint search
        .mockResolvedValueOnce([mockGuardrailsDoc]); // Guardrails search

      const result = await service.generateFromBlueprint('service', {
        entity: 'Product',
      });

      expect(result.success).toBe(true);
      expect(result.prompt).toContain(
        '## 2. 🛡️ MANDATORY STANDARDS (GUARDRAILS)',
      );
      expect(result.prompt).toContain('GUIDELINES.naming.md');
    });

    it('should handle empty variables object', async () => {
      const mockBlueprintDoc = {
        path: 'BLUEPRINT.simple.md',
        score: 0.9,
        metadata: { type: 'BLUEPRINT' },
        snippet: 'Simple blueprint without variables',
      };

      jest
        .spyOn(librarianService, 'searchDocs')
        .mockResolvedValue([mockBlueprintDoc]);

      const result = await service.generateFromBlueprint('simple', {});

      expect(result.success).toBe(true);
      expect(result.prompt).toContain('Simple blueprint without variables');
    });

    it('should include context information in prompt', async () => {
      const mockBlueprintDoc = {
        path: 'BLUEPRINT.component.md',
        score: 0.9,
        metadata: { type: 'BLUEPRINT' },
        snippet: 'Component template',
      };

      jest
        .spyOn(librarianService, 'searchDocs')
        .mockResolvedValue([mockBlueprintDoc]);

      const variables = { name: 'TestComponent', type: 'angular' };
      const result = await service.generateFromBlueprint(
        'component',
        variables,
      );

      expect(result.success).toBe(true);
      expect(result.prompt).toContain('**Context:**');
      expect(result.prompt).toContain('TestComponent');
      expect(result.prompt).toContain('angular');
    });
  });
});
