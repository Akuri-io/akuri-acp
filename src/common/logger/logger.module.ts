import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// import { setLoggerInstance } from '../../config/logger.config';
import { LoggerService } from './logger.service';

@Global()
@Module({
  providers: [
    LoggerService,
    // {
    //   provide: 'LOGGER_INIT',
    //   useFactory: (configService: ConfigService) => {
    //     setLoggerInstance(configService);
    //     return {};
    //   },
    //   inject: [ConfigService],
    // },
  ],
  exports: [LoggerService],
})
export class LoggerModule {}
