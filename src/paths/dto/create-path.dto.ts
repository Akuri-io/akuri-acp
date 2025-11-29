import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePathDto {
  @ApiProperty({
    description: 'Nombre único de la ruta de documentación',
    example: 'Documentación Técnica',
    minLength: 1,
    maxLength: 50,
    type: 'string',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(50)
  name: string;

  @ApiProperty({
    description:
      'Ruta absoluta del sistema de archivos donde se encuentra la documentación',
    example: '/home/user/docs/api-reference',
    type: 'string',
  })
  @IsString()
  @IsNotEmpty()
  path: string;

  @ApiPropertyOptional({
    description: 'Descripción opcional de la ruta y su contenido',
    example: 'Documentación completa de la API REST con ejemplos de código',
    maxLength: 200,
    type: 'string',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;
}
