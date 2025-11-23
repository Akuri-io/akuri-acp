import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AkuriCoreModule } from './akuri-core/akuri-core.module';
import { McpModule } from './mcp/mcp.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Make config available throughout the app
    }),
    AkuriCoreModule, 
    McpModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
