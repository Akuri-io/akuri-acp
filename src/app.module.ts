import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AkuriCoreModule } from './akuri-core/akuri-core.module';
import { McpModule } from './mcp/mcp.module';

@Module({
  imports: [AkuriCoreModule, McpModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
