import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BaseResponseDto } from './common/dtos';
import { AppService } from './app.service';

@ApiTags('System')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Get system information' })
  @ApiResponse({
    status: 200,
    description: 'System information retrieved successfully',
    type: BaseResponseDto,
  })
  getSystemInfo() {
    return this.appService.getSystemInfo();
  }
}
