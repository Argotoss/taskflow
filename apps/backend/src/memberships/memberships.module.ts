import { Module } from '@nestjs/common';

import { MembershipsController } from './memberships.controller';
import { MembershipsService } from './memberships.service';
import { ProjectsModule } from '../projects/projects.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule, ProjectsModule],
  controllers: [MembershipsController],
  providers: [MembershipsService],
  exports: [MembershipsService],
})
export class MembershipsModule {}
