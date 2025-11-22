import { Injectable, OnModuleInit } from '@nestjs/common';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { LibrarianService } from '../akuri-core/librarian/librarian.service';
import { WorkflowService } from '../akuri-core/workflow/workflow.service';
import { ConsistencyService } from 'src/akuri-core/consitency/consistency.service';

@Injectable()
export class McpService implements OnModuleInit {
  private server: McpServer;

  constructor(
    private librarian: LibrarianService,
    private workflow: WorkflowService,
    private consistency: ConsistencyService,
  ) {
    this.server = new McpServer({
      name: 'Akuri Context Protocol',
      version: '1.0.0',
    });
  }

  async onModuleInit() {
    this.registerTools();

    // Conectar el transporte STDIO
    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    // IMPORTANTE: No usar console.log después de esto para cosas que no sean MCP
  }

  private registerTools() {
    // Herramienta 1: Búsqueda Inteligente
    this.server.tool(
      'akuri_search_docs',
      {
        query: z.string().describe('La búsqueda semántica o palabras clave'),
        limit: z
          .number()
          .optional()
          .describe('Número máximo de documentos a retornar'),
      },
      async (args: { query: string; limit?: number }) => {
        const { query, limit } = args;
        const results = await this.librarian.searchDocs(query, limit || 5);

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
      {
        intent: z
          .enum(['PLAN', 'BUILD', 'REFACTOR', 'AUDIT'])
          .describe('La actividad que el usuario quiere realizar.'),
        feature_context: z
          .string()
          .describe(
            'Palabras clave del feature (ej: "login", "user-table", "auth").',
          ),
      },
      async ({
        intent,
        feature_context,
      }: {
        intent: 'PLAN' | 'BUILD' | 'REFACTOR' | 'AUDIT';
        feature_context: string;
      }) => {
        const validation = await this.workflow.validateWorkflow(
          intent,
          feature_context,
        );

        if (!validation.allowed) {
          // Retornamos un mensaje claro de error pero en formato texto para que la IA lo entienda y se lo diga al usuario
          return {
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
                    ? validation.context.map((d: any) => d.path)
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
      {
        blueprint_name: z
          .string()
          .describe(
            'Nombre del blueprint a usar (ej: "datatable", "crud-service")',
          ),
        variables: z
          .string()
          .describe(
            'JSON string con las variables (ej: {"entity": "User", "color": "blue"})',
          ),
      },
      async ({
        blueprint_name,
        variables,
      }: {
        blueprint_name: string;
        variables: string;
      }) => {
        let varsObj = {};
        try {
          varsObj = JSON.parse(variables);
        } catch (e) {
          return {
            isError: true,
            content: [
              {
                type: 'text' as const,
                text: "Error: 'variables' debe ser un JSON válido.",
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

    // Aquí agregaremos luego 'akuri_check_workflow' y 'akuri_generate_blueprint'
  }
}
