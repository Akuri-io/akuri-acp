import { ApiProperty } from '@nestjs/swagger';
import { PathEntity } from '../entities/path.entity';

class PathsData {
  @ApiProperty({
    description: 'List of fixed paths configured from the .env file',
    example: [
      '/mnt/0e67f549-8f2b-4fee-92ea-605bc0fd16ea/MULTIROOT/AKURI',
      '/mnt/0e67f549-8f2b-4fee-92ea-605bc0fd16ea/MULTIROOT/DOCS-EXTRA',
    ],
    type: [String],
  })
  envPaths: string[];

  @ApiProperty({
    description: 'List of dynamic paths managed via API',
    type: 'array',
    items: {
      $ref: '#/components/schemas/PathEntity',
    },
    example: [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'API Documentation',
        path: '/home/user/docs/api',
        description: 'Complete REST API documentation',
        isActive: true,
        createdAt: '2025-11-29T09:00:00.000Z',
        updatedAt: '2025-11-29T09:00:00.000Z',
      },
    ],
  })
  dynamicPaths: PathEntity[];

  @ApiProperty({
    description: 'Total number of paths (fixed + dynamic)',
    example: 3,
    type: 'number',
  })
  total: number;
}

export class PathsResponse {
  @ApiProperty({
    description: 'Indica si la operación fue exitosa',
    example: true,
    type: 'boolean',
  })
  success: boolean;

  @ApiProperty({
    description: 'Response data with organized paths',
    type: PathsData,
  })
  data: PathsData;

  @ApiProperty({
    description: 'Mensaje descriptivo de la operación',
    example: 'Paths retrieved successfully',
    type: 'string',
  })
  message: string;

  @ApiProperty({
    description: 'Timestamp ISO de cuando se generó la respuesta',
    example: '2025-11-29T09:42:54.406Z',
    type: 'string',
    format: 'date-time',
  })
  timestamp: string;
}
