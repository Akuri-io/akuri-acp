import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { LibrarianService } from '../akuri-core/librarian/librarian.service';
import { WorkflowService } from '../akuri-core/workflow/workflow.service';
import { ConsistencyService } from '../akuri-core/consitency/consistency.service';
import {
  SearchDocsSchema,
  CheckWorkflowSchema,
  GenerateBlueprintSchema,
  BlueprintVariablesSchema,
  type SearchDocsInput,
  type CheckWorkflowInput,
  type GenerateBlueprintInput,
  type BlueprintVariables,
} from '../common/validation/schemas';

interface SearchResult {
  path: string;
  score: number;
  metadata: Record<string, any>;
  snippet: string;
}

@Injectable()
export class McpService implements OnModuleInit {
  private server: McpServer;

  constructor(
    private librarian: LibrarianService,
    private workflow: WorkflowService,
    private consistency: ConsistencyService,
    private configService: ConfigService,
  ) {
    console.error('🔌 MCP Service constructor called');
    this.server = new McpServer({
      name: 'Akuri Context Protocol',
      version: '1.0.0',
    });
  }

  async onModuleInit() {
    try {
      console.error('🔌 MCP onModuleInit called');
      this.registerTools();

      // Conectar el transporte STDIO solo si estamos en modo MCP
      const isMcpMode = this.configService.get<string>('MCP_MODE') === 'true';
      console.error(
        '🔌 MCP_MODE value:',
        this.configService.get<string>('MCP_MODE'),
        'isMcpMode:',
        isMcpMode,
      );

      if (isMcpMode) {
        console.error('🔌 Connecting MCP STDIO transport...');
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error('🔌 MCP STDIO transport connected successfully');
      } else {
        console.error('🔌 MCP mode not enabled, skipping STDIO transport');
      }
    } catch (error) {
      console.error('🔌 Error in MCP onModuleInit:', error);
    }
  }

  async connectTransport(transport: any) {
    return this.server.connect(transport);
  }

  private registerTools() {
    // Herramienta 1: Búsqueda Inteligente
    this.server.tool(
      'akuri_search_docs',
      SearchDocsSchema.shape,
      async (args: SearchDocsInput) => {
        // Validación adicional con Zod (aunque MCP ya valida con el schema)
        const validatedArgs = SearchDocsSchema.parse(args);
        const { query, limit } = validatedArgs;
        const results = await this.librarian.searchDocs(query, limit);

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(results, null, 2),
            },
          ],
        };
      },
    );

    this.server.tool(
      'akuri_check_workflow',
      CheckWorkflowSchema.shape,
      async (args: CheckWorkflowInput) => {
        // Validación adicional con Zod (aunque MCP ya valida con el schema)
        const validatedArgs = CheckWorkflowSchema.parse(args);
        const { intent, feature_context } = validatedArgs;

        const validation = await this.workflow.validateWorkflow(
          intent,
          feature_context,
        );

        if (!validation.allowed) {
          // Retornamos un mensaje claro de error pero en formato texto para que la IA lo entienda y se lo diga al usuario
          return {
            isError: true,
            content: [
              {
                type: 'text' as const,
                text: validation.error || 'Unknown error occurred',
              },
            ],
          };
        }

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                {
                  status: 'APPROVED',
                  message:
                    validation.message || 'Workflow validated successfully',
                  required_docs_found: validation.context
                    ? validation.context.map((d: SearchResult) => d.path)
                    : [], // Solo pasamos las rutas para no saturar
                },
                null,
                2,
              ),
            },
          ],
        };
      },
    );

    this.server.tool(
      'akuri_generate_blueprint',
      GenerateBlueprintSchema.shape,
      async (args: GenerateBlueprintInput) => {
        // Validación adicional con Zod (aunque MCP ya valida con el schema)
        const validatedArgs = GenerateBlueprintSchema.parse(args);
        const { blueprint_name, variables } = validatedArgs;

        // Parse and validate JSON variables
        let varsObj: BlueprintVariables;
        try {
          const parsed = JSON.parse(variables);
          varsObj = BlueprintVariablesSchema.parse(parsed);
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : 'Invalid JSON or variables schema';
          return {
            isError: true,
            content: [
              {
                type: 'text' as const,
                text: `Error: ${errorMessage}`,
              },
            ],
          };
        }

        const result = await this.consistency.generateFromBlueprint(
          blueprint_name,
          varsObj,
        );

        if (!result.success) {
          return {
            isError: true,
            content: [
              {
                type: 'text' as const,
                text: result.error || 'Unknown error occurred',
              },
            ],
          };
        }

        return {
          content: [
            {
              type: 'text' as const,
              text: result.prompt || '',
            },
          ],
        };
      },
    );

    // // Aquí agregaremos luego
  }
}
