import { PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  IsBoolean,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreatePathDto } from './create-path.dto';

export class UpdatePathDto extends PartialType(CreatePathDto) {
  @ApiPropertyOptional({
    description: 'Nuevo nombre único de la ruta (opcional)',
    example: 'Documentación API v2.0',
    minLength: 1,
    maxLength: 50,
    type: 'string',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  name?: string;

  @ApiPropertyOptional({
    description: 'Nueva ruta absoluta del sistema de archivos (opcional)',
    example: '/home/user/docs/api-v2',
    type: 'string',
  })
  @IsOptional()
  @IsString()
  path?: string;

  @ApiPropertyOptional({
    description: 'Nueva descripción de la ruta (opcional)',
    example: 'Documentación actualizada de la API con nuevos endpoints',
    maxLength: 200,
    type: 'string',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;

  @ApiPropertyOptional({
    description: 'Estado de activación de la ruta (opcional)',
    example: true,
    type: 'boolean',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
