import { Injectable, NotFoundException } from '@nestjs/common';
import {
  Attachment,
  Membership,
  Prisma,
  Task,
  TaskPriority,
  TaskStatus,
  User,
} from '@prisma/client';
import { plainToInstance } from 'class-transformer';

import { UserSummaryDto } from '../common/dto/user-summary.dto';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { AttachmentResponseDto } from './dto/attachment-response.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { ListTasksQueryDto } from './dto/list-tasks-query.dto';
import { TaskAssigneeDto, TaskResponseDto } from './dto/task-response.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async listTasks(projectId: string, filters: ListTasksQueryDto): Promise<TaskResponseDto[]> {
    const where: Prisma.TaskWhereInput = {
      projectId,
    };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.assigneeId) {
      where.assigneeId = filters.assigneeId;
    }

    if (filters.search) {
      const search = filters.search.trim();
      if (search.length > 0) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }
    }

    const tasks = await this.prisma.task.findMany({
      where,
      include: {
        createdBy: true,
        assignee: {
          include: { user: true },
        },
        attachments: {
          include: { uploader: true },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
    });

    return tasks.map((task) => this.toResponse(task));
  }

  async createTask(
    projectId: string,
    creatorId: string,
    payload: CreateTaskDto,
  ): Promise<TaskResponseDto> {
    if (payload.assigneeId) {
      await this.ensureAssigneeBelongsToProject(projectId, payload.assigneeId);
    }

    const position = payload.position ?? (await this.getNextPosition(projectId));

    const task = await this.prisma.task.create({
      data: {
        projectId,
        createdById: creatorId,
        title: payload.title,
        description: payload.description,
        priority: payload.priority ?? TaskPriority.MEDIUM,
        status: payload.status ?? TaskStatus.BACKLOG,
        position,
        dueAt: payload.dueAt ?? null,
        assigneeId: payload.assigneeId ?? null,
      },
      include: {
        createdBy: true,
        assignee: {
          include: { user: true },
        },
        attachments: {
          include: { uploader: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return this.toResponse(task);
  }

  async getTask(projectId: string, taskId: string): Promise<TaskResponseDto> {
    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        projectId,
      },
      include: {
        createdBy: true,
        assignee: {
          include: { user: true },
        },
        attachments: {
          include: { uploader: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return this.toResponse(task);
  }

  async updateTask(
    projectId: string,
    taskId: string,
    payload: UpdateTaskDto,
  ): Promise<TaskResponseDto> {
    const existing = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        projectId,
      },
    });

    if (!existing) {
      throw new NotFoundException('Task not found');
    }

    if (payload.assigneeId !== undefined && payload.assigneeId !== null) {
      await this.ensureAssigneeBelongsToProject(projectId, payload.assigneeId);
    }

    const data: Parameters<typeof this.prisma.task.update>[0]['data'] = {};

    if (payload.title !== undefined) {
      data.title = payload.title;
    }

    if (payload.description !== undefined) {
      data.description = payload.description;
    }

    if (payload.priority !== undefined) {
      data.priority = payload.priority;
    }

    if (payload.position !== undefined) {
      data.position = payload.position;
    }

    if (payload.dueAt !== undefined) {
      data.dueAt = payload.dueAt ?? null;
    }

    if (payload.status !== undefined) {
      data.status = payload.status;
      if (payload.status === TaskStatus.DONE && existing.status !== TaskStatus.DONE) {
        data.completedAt = new Date();
      }
      if (payload.status !== TaskStatus.DONE && existing.status === TaskStatus.DONE) {
        data.completedAt = null;
      }
    }

    if (payload.assigneeId !== undefined) {
      data.assigneeId = payload.assigneeId ?? null;
    }

    const updated = await this.prisma.task.update({
      where: { id: existing.id },
      data,
      include: {
        createdBy: true,
        assignee: {
          include: { user: true },
        },
        attachments: {
          include: { uploader: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return this.toResponse(updated);
  }

  async deleteTask(projectId: string, taskId: string): Promise<void> {
    const existing = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        projectId,
      },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Task not found');
    }

    await this.prisma.task.delete({ where: { id: existing.id } });
  }

  private async ensureAssigneeBelongsToProject(
    projectId: string,
    membershipId: string,
  ): Promise<void> {
    const membership = await this.prisma.membership.findUnique({
      where: { id: membershipId },
      select: { projectId: true },
    });

    if (membership && membership.projectId === projectId) {
      return;
    }

    throw new NotFoundException('Assignee is not part of this project');
  }

  private async getNextPosition(projectId: string): Promise<number> {
    const result = await this.prisma.task.aggregate({
      where: { projectId },
      _max: { position: true },
    });

    const currentMax = result._max.position ?? 0;
    return currentMax + 1;
  }

  private toResponse(
    task: Task & {
      createdBy: User;
      assignee: (Membership & { user: User }) | null;
      attachments: (Attachment & { uploader: User })[];
    },
  ): TaskResponseDto {
    return plainToInstance(
      TaskResponseDto,
      {
        ...task,
        createdBy: plainToInstance(UserSummaryDto, task.createdBy, {
          excludeExtraneousValues: true,
        }),
        assignee: task.assignee
          ? plainToInstance(
              TaskAssigneeDto,
              {
                ...task.assignee,
                user: plainToInstance(UserSummaryDto, task.assignee.user, {
                  excludeExtraneousValues: true,
                }),
              },
              { excludeExtraneousValues: true },
            )
          : null,
        attachments: task.attachments.map((attachment) =>
          plainToInstance(
            AttachmentResponseDto,
            {
              ...attachment,
              url: this.storage.getPublicUrl(attachment.s3Key),
              uploader: plainToInstance(UserSummaryDto, attachment.uploader, {
                excludeExtraneousValues: true,
              }),
            },
            { excludeExtraneousValues: true },
          ),
        ),
      },
      { excludeExtraneousValues: true },
    );
  }
}
