import { Module, forwardRef } from '@nestjs/common';
import { PathsService } from './paths.service';
import { PathsController } from './paths.controller';
import { LibrarianModule } from '../akuri-core/librarian/librarian.module';

@Module({
  imports: [forwardRef(() => LibrarianModule)],
  controllers: [PathsController],
  providers: [PathsService],
  exports: [PathsService],
})
export class PathsModule {}
