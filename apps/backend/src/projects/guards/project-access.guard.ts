import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { MembershipRole } from '@prisma/client';

import { ProjectRequest } from '../../common/types/project-request';
import { PrismaService } from '../../prisma/prisma.service';
import { PROJECT_ACCESS_KEY } from '../decorators/project-access.decorator';

@Injectable()
export class ProjectAccessGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<ProjectRequest>();
    const userId = request.user?.userId;

    if (!userId) {
      throw new UnauthorizedException('Authentication required');
    }

    const projectId = this.resolveProjectId(request);

    const membership = await this.prisma.membership.findUnique({
      where: {
        userId_projectId: {
          userId,
          projectId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('You do not have access to this project');
    }

    request.projectMembership = membership;

    const requiredRoles =
      this.reflector.getAllAndOverride<MembershipRole[]>(PROJECT_ACCESS_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    if (requiredRoles.length === 0) {
      return true;
    }

    if (!requiredRoles.includes(membership.role)) {
      throw new ForbiddenException('Insufficient project permissions');
    }

    return true;
  }

  private resolveProjectId(request: ProjectRequest): string {
    const projectId =
      request.params?.projectId ??
      request.params?.id ??
      request.body?.projectId ??
      request.query?.projectId;

    if (!projectId) {
      throw new BadRequestException('Route is missing a projectId parameter');
    }

    return projectId;
  }
}
