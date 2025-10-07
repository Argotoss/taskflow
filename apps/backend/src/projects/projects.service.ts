import { Injectable, NotFoundException } from '@nestjs/common';
import { MembershipRole, Project, ProjectStatus } from '@prisma/client';
import { plainToInstance } from 'class-transformer';

import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { ListProjectsQueryDto } from './dto/list-projects-query.dto';
import { ProjectResponseDto } from './dto/project-response.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async createProject(ownerId: string, payload: CreateProjectDto): Promise<ProjectResponseDto> {
    const result = await this.prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          name: payload.name,
          description: payload.description,
          ownerId: ownerId,
        },
      });

      await tx.membership.create({
        data: {
          projectId: project.id,
          userId: ownerId,
          role: MembershipRole.OWNER,
        },
      });

      return project;
    });

    return this.toProjectResponse(result, MembershipRole.OWNER);
  }

  async listProjectsForUser(
    userId: string,
    filters: ListProjectsQueryDto,
  ): Promise<ProjectResponseDto[]> {
    const where: { userId: string; project?: { status?: ProjectStatus } } = {
      userId,
    };

    if (filters.status) {
      where.project = { status: filters.status };
    }

    const memberships = await this.prisma.membership.findMany({
      where,
      include: {
        project: true,
      },
      orderBy: {
        project: {
          createdAt: 'desc',
        },
      },
    });

    return memberships.map((membership) =>
      this.toProjectResponse(membership.project, membership.role),
    );
  }

  async getProjectForUser(projectId: string, userId: string): Promise<ProjectResponseDto> {
    const membership = await this.prisma.membership.findUnique({
      where: {
        userId_projectId: {
          userId,
          projectId,
        },
      },
      include: {
        project: true,
      },
    });

    if (!membership) {
      throw new NotFoundException('Project not found');
    }

    return this.toProjectResponse(membership.project, membership.role);
  }

  async updateProject(
    projectId: string,
    updates: UpdateProjectDto,
    role: MembershipRole,
  ): Promise<ProjectResponseDto> {
    const project = await this.prisma.project.update({
      where: { id: projectId },
      data: {
        name: updates.name,
        description: updates.description,
        status: updates.status,
      },
    });

    return this.toProjectResponse(project, role);
  }

  private toProjectResponse(project: Project, role: MembershipRole) {
    return plainToInstance(
      ProjectResponseDto,
      {
        ...project,
        role,
      },
      { excludeExtraneousValues: true },
    );
  }
}
