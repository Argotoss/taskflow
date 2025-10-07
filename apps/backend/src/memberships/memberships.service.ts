import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Membership, MembershipRole } from '@prisma/client';
import { plainToInstance } from 'class-transformer';

import { UserSummaryDto } from '../common/dto/user-summary.dto';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { AddMemberDto } from './dto/add-member.dto';
import { MembershipResponseDto } from './dto/membership-response.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';

@Injectable()
export class MembershipsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  async listMembers(projectId: string): Promise<MembershipResponseDto[]> {
    const memberships = await this.prisma.membership.findMany({
      where: { projectId },
      include: { user: true },
      orderBy: { joinedAt: 'asc' },
    });

    return memberships.map((membership) => this.toResponse(membership));
  }

  async addMember(
    projectId: string,
    actorId: string,
    payload: AddMemberDto,
  ): Promise<MembershipResponseDto> {
    const user = await this.usersService.findByEmail(payload.email);

    if (!user) {
      throw new NotFoundException('User with that email does not exist');
    }

    const existing = await this.prisma.membership.findUnique({
      where: {
        userId_projectId: {
          userId: user.id,
          projectId,
        },
      },
    });

    if (existing) {
      throw new ConflictException('User is already a member of this project');
    }

    const membership = await this.prisma.membership.create({
      data: {
        projectId,
        userId: user.id,
        role: payload.role ?? MembershipRole.CONTRIBUTOR,
        invitedById: actorId,
      },
      include: { user: true },
    });

    return this.toResponse(membership);
  }

  async updateMemberRole(
    projectId: string,
    membershipId: string,
    payload: UpdateMemberRoleDto,
  ): Promise<MembershipResponseDto> {
    const membership = await this.prisma.membership.findUnique({
      where: { id: membershipId },
      include: { user: true },
    });

    if (!membership || membership.projectId !== projectId) {
      throw new NotFoundException('Membership not found');
    }

    if (membership.role === MembershipRole.OWNER && payload.role !== MembershipRole.OWNER) {
      await this.ensureAnotherOwnerExists(projectId, membership.id);
    }

    const updated = await this.prisma.membership.update({
      where: { id: membershipId },
      data: {
        role: payload.role,
      },
      include: { user: true },
    });

    return this.toResponse(updated);
  }

  async removeMember(projectId: string, membershipId: string): Promise<void> {
    const membership = await this.prisma.membership.findUnique({
      where: { id: membershipId },
    });

    if (!membership || membership.projectId !== projectId) {
      throw new NotFoundException('Membership not found');
    }

    if (membership.role === MembershipRole.OWNER) {
      await this.ensureAnotherOwnerExists(projectId, membership.id);
    }

    await this.prisma.membership.delete({
      where: { id: membershipId },
    });
  }

  private async ensureAnotherOwnerExists(projectId: string, excludingMembershipId: string) {
    const owners = await this.prisma.membership.count({
      where: {
        projectId,
        role: MembershipRole.OWNER,
        NOT: { id: excludingMembershipId },
      },
    });

    if (owners === 0) {
      throw new BadRequestException('Project must retain at least one owner');
    }
  }

  private toResponse(
    membership: Membership & {
      user: UserSummaryDto;
    },
  ): MembershipResponseDto {
    return plainToInstance(
      MembershipResponseDto,
      {
        ...membership,
        user: plainToInstance(UserSummaryDto, membership.user, { excludeExtraneousValues: true }),
      },
      { excludeExtraneousValues: true },
    );
  }
}
