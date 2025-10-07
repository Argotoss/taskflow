import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { MembershipRole } from '@prisma/client';

import { CreateTaskDto } from './dto/create-task.dto';
import { ListTasksQueryDto } from './dto/list-tasks-query.dto';
import { TaskResponseDto } from './dto/task-response.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TasksService } from './tasks.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../common/types/authenticated-request';
import { ProjectAccess } from '../projects/decorators/project-access.decorator';
import { ProjectAccessGuard } from '../projects/guards/project-access.guard';

@Controller('projects/:projectId/tasks')
@UseGuards(JwtAuthGuard, ProjectAccessGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  async listTasks(
    @Param('projectId') projectId: string,
    @Query() query: ListTasksQueryDto,
  ): Promise<TaskResponseDto[]> {
    return this.tasksService.listTasks(projectId, query);
  }

  @Post()
  @ProjectAccess(MembershipRole.CONTRIBUTOR, MembershipRole.ADMIN, MembershipRole.OWNER)
  async createTask(
    @Param('projectId') projectId: string,
    @Request() req: AuthenticatedRequest,
    @Body() payload: CreateTaskDto,
  ): Promise<TaskResponseDto> {
    return this.tasksService.createTask(projectId, req.user.userId, payload);
  }

  @Get(':taskId')
  async getTask(
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
  ): Promise<TaskResponseDto> {
    return this.tasksService.getTask(projectId, taskId);
  }

  @Patch(':taskId')
  @ProjectAccess(MembershipRole.CONTRIBUTOR, MembershipRole.ADMIN, MembershipRole.OWNER)
  async updateTask(
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @Body() payload: UpdateTaskDto,
  ): Promise<TaskResponseDto> {
    return this.tasksService.updateTask(projectId, taskId, payload);
  }

  @Delete(':taskId')
  @ProjectAccess(MembershipRole.ADMIN, MembershipRole.OWNER)
  async deleteTask(
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
  ): Promise<void> {
    await this.tasksService.deleteTask(projectId, taskId);
  }
}
