import { Body, Controller, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { MembershipRole } from '@prisma/client';

import { AttachmentResponseDto } from './dto/attachment-response.dto';
import { CreateAttachmentDto } from './dto/create-attachment.dto';
import { PresignAttachmentDto } from './dto/presign-attachment.dto';
import { TaskAttachmentsService } from './task-attachments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../common/types/authenticated-request';
import { ProjectAccess } from '../projects/decorators/project-access.decorator';
import { ProjectAccessGuard } from '../projects/guards/project-access.guard';

type PresignResponse = {
  key: string;
  uploadUrl: string;
  headers: Record<string, string>;
  expiresIn: number;
  url: string | null;
};

@ApiTags('attachments')
@ApiBearerAuth()
@Controller('projects/:projectId/tasks/:taskId/attachments')
@UseGuards(JwtAuthGuard, ProjectAccessGuard)
export class TaskAttachmentsController {
  constructor(private readonly attachmentsService: TaskAttachmentsService) {}

  @Get()
  async list(
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
  ): Promise<AttachmentResponseDto[]> {
    return this.attachmentsService.list(projectId, taskId);
  }

  @Post('presign')
  @ProjectAccess(MembershipRole.CONTRIBUTOR, MembershipRole.ADMIN, MembershipRole.OWNER)
  async presign(
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @Body() payload: PresignAttachmentDto,
  ): Promise<PresignResponse> {
    return this.attachmentsService.createPresignedUpload(projectId, taskId, payload);
  }

  @Post()
  @ProjectAccess(MembershipRole.CONTRIBUTOR, MembershipRole.ADMIN, MembershipRole.OWNER)
  async create(
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @Request() req: AuthenticatedRequest,
    @Body() payload: CreateAttachmentDto,
  ): Promise<AttachmentResponseDto> {
    return this.attachmentsService.createAttachment(projectId, taskId, req.user.userId, payload);
  }
}
