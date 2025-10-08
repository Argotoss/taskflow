import { Module } from '@nestjs/common';

import { TaskAttachmentsController } from './task-attachments.controller';
import { TaskAttachmentsService } from './task-attachments.service';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { ProjectsModule } from '../projects/projects.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [ProjectsModule, StorageModule],
  controllers: [TasksController, TaskAttachmentsController],
  providers: [TasksService, TaskAttachmentsService],
  exports: [TasksService],
})
export class TasksModule {}
