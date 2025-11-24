import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthController } from './health.controller';
import { ConfigController } from './config.controller';
import { LoggerModule } from './common/logger/logger.module';
import { AkuriCoreModule } from './akuri-core/akuri-core.module';
import { AkuriConfigModule } from './akuri-core/config/config.module';
import { McpModule } from './mcp/mcp.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Make config available throughout the app
    }),
    TerminusModule,
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000, // 1 second
        limit: 10, // 10 requests per second
      },
      {
        name: 'medium',
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),
    LoggerModule,
    AkuriCoreModule,
    AkuriConfigModule,
    McpModule,
  ],
  controllers: [AppController, HealthController, ConfigController],
  providers: [AppService],
})
export class AppModule {}
