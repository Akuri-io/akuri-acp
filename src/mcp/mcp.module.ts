import { Module } from '@nestjs/common';
import { McpService } from './mcp.service';
import { AkuriCoreModule } from '../akuri-core/akuri-core.module';

import { McpController } from './mcp.controller';

@Module({
  imports: [AkuriCoreModule],
  controllers: [McpController],
  providers: [McpService],
  exports: [McpService],
})
export class McpModule {}
