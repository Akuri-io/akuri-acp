import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PathEntity {
  @ApiProperty({
    description:
      'Identificador único de la ruta (UUID para dinámicas, env-{path} para fijas)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: 'string',
  })
  id: string;

  @ApiProperty({
    description: 'Nombre único de la ruta de documentación',
    example: 'Documentación Técnica API',
    type: 'string',
  })
  name: string;

  @ApiProperty({
    description: 'Ruta absoluta del sistema de archivos',
    example: '/home/user/docs/api-reference',
    type: 'string',
  })
  path: string;

  @ApiPropertyOptional({
    description: 'Descripción opcional del contenido de la ruta',
    example: 'Documentación completa de la API REST con ejemplos de código',
    type: 'string',
  })
  description?: string;

  @ApiProperty({
    description: 'Indica si la ruta está activa y disponible para indexación',
    example: true,
    type: 'boolean',
    default: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Fecha y hora de creación de la ruta',
    example: '2025-11-29T09:00:00.000Z',
    type: 'string',
    format: 'date-time',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Fecha y hora de la última actualización de la ruta',
    example: '2025-11-29T09:30:00.000Z',
    type: 'string',
    format: 'date-time',
  })
  updatedAt: Date;
}
