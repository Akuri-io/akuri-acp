import { ApiProperty } from '@nestjs/swagger';

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
