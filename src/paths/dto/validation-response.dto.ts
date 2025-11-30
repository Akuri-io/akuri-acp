import { ApiProperty } from '@nestjs/swagger';

export class PermissionDetails {
  @ApiProperty({
    description: 'Indicates if the path can be read',
    example: true,
    type: 'boolean',
  })
  canRead: boolean;

  @ApiProperty({
    description: 'Indicates if the path can be written to',
    example: false,
    type: 'boolean',
  })
  canWrite: boolean;

  @ApiProperty({
    description: 'Indicates if the path can be executed',
    example: false,
    type: 'boolean',
  })
  canExecute: boolean;

  @ApiProperty({
    description: 'Detailed permission information',
    example: 'drwxr-xr-x',
    type: 'string',
  })
  permissions: string;
}

export class ValidationResponse {
  @ApiProperty({
    description: 'Indicates if the operation was successful',
    example: true,
    type: 'boolean',
  })
  success: boolean;

  @ApiProperty({
    description: 'Indicates if the path is valid and accessible',
    example: true,
    type: 'boolean',
  })
  valid: boolean;

  @ApiProperty({
    description: 'Detailed permission information',
    type: PermissionDetails,
  })
  permissions: PermissionDetails;

  @ApiProperty({
    description: 'Descriptive message about the validation result',
    example: 'Path is valid and accessible',
    type: 'string',
  })
  message: string;

  @ApiProperty({
    description: 'ISO timestamp of when the response was generated',
    example: '2025-11-29T09:42:54.406Z',
    type: 'string',
    format: 'date-time',
  })
  timestamp: string;
}
