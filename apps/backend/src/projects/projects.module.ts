import { Module } from '@nestjs/common';

import { ProjectAccessGuard } from './guards/project-access.guard';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';

@Module({
  controllers: [ProjectsController],
  providers: [ProjectsService, ProjectAccessGuard],
  exports: [ProjectsService, ProjectAccessGuard],
})
export class ProjectsModule {}
