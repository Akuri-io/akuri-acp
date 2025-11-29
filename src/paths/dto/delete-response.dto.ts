import { ApiProperty } from '@nestjs/swagger';

export class DeleteResponse {
  @ApiProperty({
    description: 'Indicates if the operation was successful',
    example: true,
    type: 'boolean',
  })
  success: boolean;

  @ApiProperty({
    description: 'Descriptive message of the operation',
    example: 'Path deleted successfully',
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
