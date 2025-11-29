import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { AkuriConfigService } from './config.service';
import { LoggerModule } from '../../common/logger/logger.module';

@Module({
  imports: [NestConfigModule, LoggerModule],
  providers: [AkuriConfigService],
  exports: [AkuriConfigService],
})
export class AkuriConfigModule {}
