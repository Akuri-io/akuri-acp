import { Module } from '@nestjs/common';
import { LibrarianModule } from './librarian/librarian.module';
import { WorkflowService } from './workflow/workflow.service';
import { ConsistencyService } from './consitency/consistency.service';

@Module({
  providers: [WorkflowService, ConsistencyService],
  imports: [LibrarianModule],
  exports: [LibrarianModule, WorkflowService, ConsistencyService],
})
export class AkuriCoreModule {}
