import { z } from 'zod';

export const AkuriDocSchema = z.object({
  title: z.string().optional(),
  trigger: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['draft', 'active', 'deprecated', 'archived']).optional(),
  version: z.string().optional(),
  layer: z.enum(['architecture', 'logic', 'connectivity', 'ui']).optional(),
  tags: z.array(z.string()).optional(),
  use_case: z.array(z.string()).optional(),
});

export type AkuriDocMetadata = z.infer<typeof AkuriDocSchema>;
