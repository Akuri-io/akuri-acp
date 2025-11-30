import { ApiProperty } from '@nestjs/swagger';

export class BaseResponseDto<T = any> {
  @ApiProperty({
    description: 'Indicates if the operation was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'The response data',
    required: false,
  })
  data?: T;

  @ApiProperty({
    description: 'A message describing the result of the operation',
    example: 'Operation completed successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Timestamp of when the response was generated',
    example: '2025-11-30T13:04:50.051Z',
  })
  timestamp: string;
}
