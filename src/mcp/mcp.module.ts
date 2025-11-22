import { Module } from '@nestjs/common';
import { McpService } from './mcp.service';
import { AkuriCoreModule } from '../akuri-core/akuri-core.module';

@Module({
  imports: [AkuriCoreModule],
  providers: [McpService],
  exports: [McpService],
})
export class McpModule {}
