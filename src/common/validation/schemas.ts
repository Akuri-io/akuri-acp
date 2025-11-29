import { z } from 'zod';

// Schema for akuri_search_docs tool
export const SearchDocsSchema = z.object({
  query: z
    .string()
    .min(1, 'Query cannot be empty')
    .max(500, 'Query too long')
    .describe('La búsqueda semántica o palabras clave'),
  limit: z
    .number()
    .int('Limit must be an integer')
    .min(1, 'Limit must be at least 1')
    .max(50, 'Limit cannot exceed 50')
    .optional()
    .default(5)
    .describe('Número máximo de documentos a retornar'),
});

// Schema for akuri_check_workflow tool
export const CheckWorkflowSchema = z.object({
  intent: z
    .enum(['PLAN', 'BUILD', 'REFACTOR', 'AUDIT'], {
      errorMap: () => ({
        message: 'Intent must be one of: PLAN, BUILD, REFACTOR, AUDIT',
      }),
    })
    .describe('La actividad que el usuario quiere realizar.'),
  feature_context: z
    .string()
    .min(1, 'Feature context cannot be empty')
    .max(200, 'Feature context too long')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Feature context contains invalid characters')
    .describe(
      'Palabras clave del feature (ej: "login", "user-table", "auth").',
    ),
});

// Schema for akuri_generate_blueprint tool
export const GenerateBlueprintSchema = z.object({
  blueprint_name: z
    .string()
    .min(1, 'Blueprint name cannot be empty')
    .max(100, 'Blueprint name too long')
    .regex(/^[a-zA-Z0-9\-_]+$/, 'Blueprint name contains invalid characters')
    .describe('Nombre del blueprint a usar (ej: "datatable", "crud-service")'),
  variables: z
    .string()
    .min(1, 'Variables cannot be empty')
    .max(5000, 'Variables JSON too large')
    .describe(
      'JSON string con las variables (ej: {"entity": "User", "color": "blue"})',
    ),
});

// Schema for blueprint variables (parsed JSON) - compatible with existing implementation
export const BlueprintVariablesSchema = z
  .record(
    z.string().min(1).max(100),
    z.string().min(1).max(1000), // For now, keep as strings to match existing implementation
  )
  .refine(
    (vars) => Object.keys(vars).length > 0,
    'Variables object cannot be empty',
  )
  .refine(
    (vars) => Object.keys(vars).length <= 20,
    'Too many variables (max 20)',
  );

// Type exports for TypeScript
export type SearchDocsInput = z.infer<typeof SearchDocsSchema>;
export type CheckWorkflowInput = z.infer<typeof CheckWorkflowSchema>;
export type GenerateBlueprintInput = z.infer<typeof GenerateBlueprintSchema>;
export type BlueprintVariables = z.infer<typeof BlueprintVariablesSchema>;
