import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AdminController } from './admin.controller';
import { AdminApiController } from './admin-api.controller';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'public'),
      serveRoot: '/admin/static',
      serveStaticOptions: {
        index: false, // No servir index.html automáticamente
      },
    }),
  ],
  controllers: [AdminController, AdminApiController],
})
export class AdminModule {}
