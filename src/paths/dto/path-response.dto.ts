import { ApiProperty } from '@nestjs/swagger';
import { PathEntity } from '../entities/path.entity';

export class PathResponse {
  @ApiProperty({
    description: 'Indica si la operación fue exitosa',
    example: true,
    type: 'boolean',
  })
  success: boolean;

  @ApiProperty({
    description: 'Datos de la ruta creada/actualizada',
    type: PathEntity,
    example: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Documentación API',
      path: '/home/user/docs/api',
      description: 'Documentación completa de la API REST',
      isActive: true,
      createdAt: '2025-11-29T09:00:00.000Z',
      updatedAt: '2025-11-29T09:00:00.000Z',
    },
  })
  data: PathEntity;

  @ApiProperty({
    description: 'Mensaje descriptivo de la operación',
    example: 'Path created successfully',
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
