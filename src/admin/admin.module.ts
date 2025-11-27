import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AdminController } from './admin.controller';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'public'),
      serveRoot: '/admin',
      serveStaticOptions: {
        index: false, // No servir index.html automáticamente
      },
    }),
  ],
  controllers: [AdminController],
})
export class AdminModule {}
