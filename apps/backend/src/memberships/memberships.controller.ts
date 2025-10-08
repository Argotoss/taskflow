import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { MembershipRole } from '@prisma/client';

import { AddMemberDto } from './dto/add-member.dto';
import { MembershipResponseDto } from './dto/membership-response.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { MembershipsService } from './memberships.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../common/types/authenticated-request';
import { ProjectAccess } from '../projects/decorators/project-access.decorator';
import { ProjectAccessGuard } from '../projects/guards/project-access.guard';

@ApiTags('memberships')
@ApiBearerAuth()
@Controller('projects/:projectId/memberships')
@UseGuards(JwtAuthGuard, ProjectAccessGuard)
export class MembershipsController {
  constructor(private readonly membershipsService: MembershipsService) {}

  @Get()
  async listMembers(@Param('projectId') projectId: string): Promise<MembershipResponseDto[]> {
    return this.membershipsService.listMembers(projectId);
  }

  @Post()
  @ProjectAccess(MembershipRole.ADMIN, MembershipRole.OWNER)
  async addMember(
    @Param('projectId') projectId: string,
    @Request() req: AuthenticatedRequest,
    @Body() payload: AddMemberDto,
  ): Promise<MembershipResponseDto> {
    return this.membershipsService.addMember(projectId, req.user.userId, payload);
  }

  @Patch(':membershipId')
  @ProjectAccess(MembershipRole.OWNER)
  async updateMemberRole(
    @Param('projectId') projectId: string,
    @Param('membershipId') membershipId: string,
    @Body() payload: UpdateMemberRoleDto,
  ): Promise<MembershipResponseDto> {
    return this.membershipsService.updateMemberRole(projectId, membershipId, payload);
  }

  @Delete(':membershipId')
  @ProjectAccess(MembershipRole.ADMIN, MembershipRole.OWNER)
  async removeMember(
    @Param('projectId') projectId: string,
    @Param('membershipId') membershipId: string,
  ): Promise<void> {
    await this.membershipsService.removeMember(projectId, membershipId);
  }
}
