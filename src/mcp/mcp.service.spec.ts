import { Test, TestingModule } from '@nestjs/testing';
import { McpService } from './mcp.service';
import { LibrarianService } from '../akuri-core/librarian/librarian.service';
import { WorkflowService } from '../akuri-core/workflow/workflow.service';
import { ConsistencyService } from '../akuri-core/consitency/consistency.service';

// Mock the MCP SDK
jest.mock('@modelcontextprotocol/sdk/server/mcp.js', () => ({
  McpServer: jest.fn().mockImplementation(() => ({
    tool: jest.fn(),
    connect: jest.fn().mockResolvedValue(undefined),
  })),
}));

jest.mock('@modelcontextprotocol/sdk/server/stdio.js', () => ({
  StdioServerTransport: jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockResolvedValue(undefined),
  })),
}));

describe('McpService', () => {
  let service: McpService;
  let librarianService: LibrarianService;
  let workflowService: WorkflowService;
  let consistencyService: ConsistencyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        McpService,
        {
          provide: LibrarianService,
          useValue: {
            searchDocs: jest.fn(),
          },
        },
        {
          provide: WorkflowService,
          useValue: {
            validateWorkflow: jest.fn(),
          },
        },
        {
          provide: ConsistencyService,
          useValue: {
            generateFromBlueprint: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<McpService>(McpService);
    librarianService = module.get<LibrarianService>(LibrarianService);
    workflowService = module.get<WorkflowService>(WorkflowService);
    consistencyService = module.get<ConsistencyService>(ConsistencyService);

    // Manually call onModuleInit to register tools
    await service.onModuleInit();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('akuri_search_docs tool', () => {
    it('should call librarian searchDocs with correct parameters', async () => {
      const mockResults = [
        {
          path: 'test.md',
          score: 0.9,
          metadata: { title: 'Test' },
          snippet: 'Test content...',
        },
      ];

      jest.spyOn(librarianService, 'searchDocs').mockResolvedValue(mockResults);

      // Access the tool handler directly
      const toolHandlers = (service as any).server.tool.mock.calls;
      const searchTool = toolHandlers.find(
        ([name]: [string]) => name === 'akuri_search_docs',
      );

      expect(searchTool).toBeDefined();

      const [, , handler] = searchTool;
      const result = await handler({ query: 'test search', limit: 3 });

      expect(librarianService.searchDocs).toHaveBeenCalledWith(
        'test search',
        3,
      );
      expect(result.content[0].text).toBe(JSON.stringify(mockResults, null, 2));
    });

    it('should use default limit of 5 when not specified', async () => {
      const mockResults: any[] = [];

      jest.spyOn(librarianService, 'searchDocs').mockResolvedValue(mockResults);

      const toolHandlers = (service as any).server.tool.mock.calls;
      const searchTool = toolHandlers.find(
        ([name]: [string]) => name === 'akuri_search_docs',
      );

      const [, , handler] = searchTool;
      await handler({ query: 'test search' });

      expect(librarianService.searchDocs).toHaveBeenCalledWith(
        'test search',
        5,
      );
    });
  });

  describe('akuri_check_workflow tool', () => {
    it('should validate workflow and return success', async () => {
      const mockValidation = {
        allowed: true,
        message: 'Workflow validated successfully',
        context: [
          {
            path: 'DESIGN.test.md',
            score: 0.9,
            metadata: { type: 'DESIGN' },
            snippet: 'Design content',
          },
        ],
      };

      jest
        .spyOn(workflowService, 'validateWorkflow')
        .mockResolvedValue(mockValidation);

      const toolHandlers = (service as any).server.tool.mock.calls;
      const workflowTool = toolHandlers.find(
        ([name]: [string]) => name === 'akuri_check_workflow',
      );

      const [, , handler] = workflowTool;
      const result = await handler({
        intent: 'PLAN',
        feature_context: 'user management',
      });

      expect(workflowService.validateWorkflow).toHaveBeenCalledWith(
        'PLAN',
        'user management',
      );
      expect(result.content[0].text).toContain('APPROVED');
      expect(result.content[0].text).toContain('DESIGN.test.md');
    });

    it('should return error when workflow validation fails', async () => {
      const mockValidation = {
        allowed: false,
        error: 'Missing DESIGN document',
        missing: ['DESIGN'],
      };

      jest
        .spyOn(workflowService, 'validateWorkflow')
        .mockResolvedValue(mockValidation);

      const toolHandlers = (service as any).server.tool.mock.calls;
      const workflowTool = toolHandlers.find(
        ([name]: [string]) => name === 'akuri_check_workflow',
      );

      const [, , handler] = workflowTool;
      const result = await handler({
        intent: 'BUILD',
        feature_context: 'user management',
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toBe('Missing DESIGN document');
    });
  });

  describe('akuri_generate_blueprint tool', () => {
    it('should generate blueprint successfully', async () => {
      const mockBlueprintResult = {
        success: true,
        prompt: 'Generated prompt content',
      };

      jest
        .spyOn(consistencyService, 'generateFromBlueprint')
        .mockResolvedValue(mockBlueprintResult);

      const toolHandlers = (service as any).server.tool.mock.calls;
      const blueprintTool = toolHandlers.find(
        ([name]: [string]) => name === 'akuri_generate_blueprint',
      );

      const [, , handler] = blueprintTool;
      const result = await handler({
        blueprint_name: 'datatable',
        variables: '{"entity": "User", "columns": "name,email"}',
      });

      expect(consistencyService.generateFromBlueprint).toHaveBeenCalledWith(
        'datatable',
        {
          entity: 'User',
          columns: 'name,email',
        },
      );
      expect(result.content[0].text).toBe('Generated prompt content');
    });

    it('should handle invalid JSON in variables', async () => {
      const toolHandlers = (service as any).server.tool.mock.calls;
      const blueprintTool = toolHandlers.find(
        ([name]: [string]) => name === 'akuri_generate_blueprint',
      );

      const [, , handler] = blueprintTool;
      const result = await handler({
        blueprint_name: 'datatable',
        variables: 'invalid json',
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('not valid JSON');
    });

    it('should return error when blueprint generation fails', async () => {
      const mockBlueprintResult = {
        success: false,
        error: 'Blueprint not found',
      };

      jest
        .spyOn(consistencyService, 'generateFromBlueprint')
        .mockResolvedValue(mockBlueprintResult);

      const toolHandlers = (service as any).server.tool.mock.calls;
      const blueprintTool = toolHandlers.find(
        ([name]: [string]) => name === 'akuri_generate_blueprint',
      );

      const [, , handler] = blueprintTool;
      const result = await handler({
        blueprint_name: 'nonexistent',
        variables: '{"entity": "Test"}',
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toBe('Blueprint not found');
    });
  });

  describe('tool registration', () => {
    it('should register all three tools on initialization', () => {
      // Check that server.tool was called 3 times
      expect((service as any).server.tool).toHaveBeenCalledTimes(3);

      const toolCalls = (service as any).server.tool.mock.calls;
      const toolNames = toolCalls.map(([name]: [string]) => name);

      expect(toolNames).toContain('akuri_search_docs');
      expect(toolNames).toContain('akuri_check_workflow');
      expect(toolNames).toContain('akuri_generate_blueprint');
    });

    it('should configure tools with correct schemas', () => {
      const toolCalls = (service as any).server.tool.mock.calls;

      // Check akuri_search_docs schema
      const searchTool = toolCalls.find(
        ([name]: [string]) => name === 'akuri_search_docs',
      );
      expect(searchTool[1]).toHaveProperty('query');
      expect(searchTool[1]).toHaveProperty('limit');

      // Check akuri_check_workflow schema
      const workflowTool = toolCalls.find(
        ([name]: [string]) => name === 'akuri_check_workflow',
      );
      expect(workflowTool[1]).toHaveProperty('intent');
      expect(workflowTool[1]).toHaveProperty('feature_context');

      // Check akuri_generate_blueprint schema
      const blueprintTool = toolCalls.find(
        ([name]: [string]) => name === 'akuri_generate_blueprint',
      );
      expect(blueprintTool[1]).toHaveProperty('blueprint_name');
      expect(blueprintTool[1]).toHaveProperty('variables');
    });
  });
});
