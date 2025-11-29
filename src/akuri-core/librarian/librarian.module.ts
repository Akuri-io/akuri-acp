import { Module } from '@nestjs/common';
import { PathsModule } from '../../paths/paths.module';
import { LibrarianService } from './librarian.service';

@Module({
  imports: [PathsModule],
  providers: [LibrarianService],
  exports: [LibrarianService],
})
export class LibrarianModule {}
