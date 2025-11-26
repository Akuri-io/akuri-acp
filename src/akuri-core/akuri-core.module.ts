import { Module } from '@nestjs/common';
import { LibrarianModule } from './librarian/librarian.module';
import { WorkflowService } from './workflow/workflow.service';
import { ConsistencyService } from './consitency/consistency.service';
import { IngestionModule } from './ingestion/ingestion.module';

@Module({
  providers: [WorkflowService, ConsistencyService],
  imports: [LibrarianModule, IngestionModule],
  exports: [LibrarianModule, WorkflowService, ConsistencyService],
})
export class AkuriCoreModule {}
