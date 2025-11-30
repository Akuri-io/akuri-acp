import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchDocsDto {
  @ApiProperty({
    description: 'The search query string',
    example: 'real estate platform',
    type: 'string',
  })
  @IsString()
  query: string;

  @ApiProperty({
    description: 'Maximum number of results to return',
    example: 5,
    default: 5,
    required: false,
    type: 'number',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 5;
}

export class SearchResultDto {
  @ApiProperty({
    description: 'Relative path of the document',
    example: 'design.md',
    type: 'string',
  })
  path: string;

  @ApiProperty({
    description: 'Search relevance score',
    example: 0.85,
    type: 'number',
  })
  score: number;

  @ApiProperty({
    description: 'Document metadata',
    example: { title: 'Design Philosophy' },
    type: 'object',
    additionalProperties: true,
  })
  metadata: Record<string, any>;

  @ApiProperty({
    description: 'Content snippet with search highlights',
    example: 'This is a modern real estate platform...',
    type: 'string',
  })
  snippet: string;
}

export class SearchResponseDto {
  @ApiProperty({
    description: 'Indicates if the operation was successful',
    example: true,
    type: 'boolean',
  })
  success: boolean;

  @ApiProperty({
    description: 'Array of search results',
    type: [SearchResultDto],
  })
  data: SearchResultDto[];

  @ApiProperty({
    description: 'Descriptive message about the search results',
    example: 'Found 3 documents matching "real estate"',
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
