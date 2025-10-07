import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { MembershipRole } from '@prisma/client';

import { ProjectAccess } from './decorators/project-access.decorator';
import { CreateProjectDto } from './dto/create-project.dto';
import { ListProjectsQueryDto } from './dto/list-projects-query.dto';
import { ProjectResponseDto } from './dto/project-response.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectAccessGuard } from './guards/project-access.guard';
import { ProjectsService } from './projects.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../common/types/authenticated-request';
import { ProjectRequest } from '../common/types/project-request';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  async listProjects(
    @Request() req: AuthenticatedRequest,
    @Query() query: ListProjectsQueryDto,
  ): Promise<ProjectResponseDto[]> {
    return this.projectsService.listProjectsForUser(req.user.userId, query);
  }

  @Post()
  async createProject(
    @Request() req: AuthenticatedRequest,
    @Body() payload: CreateProjectDto,
  ): Promise<ProjectResponseDto> {
    return this.projectsService.createProject(req.user.userId, payload);
  }

  @Get(':projectId')
  @UseGuards(ProjectAccessGuard)
  async getProject(
    @Param('projectId') projectId: string,
    @Request() req: ProjectRequest,
  ): Promise<ProjectResponseDto> {
    return this.projectsService.getProjectForUser(projectId, req.user.userId);
  }

  @Patch(':projectId')
  @UseGuards(ProjectAccessGuard)
  @ProjectAccess(MembershipRole.ADMIN, MembershipRole.OWNER)
  async updateProject(
    @Param('projectId') projectId: string,
    @Request() req: ProjectRequest,
    @Body() payload: UpdateProjectDto,
  ): Promise<ProjectResponseDto> {
    return this.projectsService.updateProject(
      projectId,
      payload,
      req.projectMembership?.role ?? MembershipRole.CONTRIBUTOR,
    );
  }
}
