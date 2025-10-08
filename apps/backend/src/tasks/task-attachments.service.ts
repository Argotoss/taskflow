import { Injectable, NotFoundException } from '@nestjs/common';
import { Attachment, User } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { randomUUID } from 'node:crypto';

import { AttachmentResponseDto } from './dto/attachment-response.dto';
import { CreateAttachmentDto } from './dto/create-attachment.dto';
import { PresignAttachmentDto } from './dto/presign-attachment.dto';
import { UserSummaryDto } from '../common/dto/user-summary.dto';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

type PresignResponse = {
  key: string;
  uploadUrl: string;
  headers: Record<string, string>;
  expiresIn: number;
  url: string | null;
};

@Injectable()
export class TaskAttachmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async list(projectId: string, taskId: string): Promise<AttachmentResponseDto[]> {
    await this.ensureTaskBelongsToProject(projectId, taskId);

    const attachments = await this.prisma.attachment.findMany({
      where: { taskId },
      orderBy: { createdAt: 'desc' },
      include: { uploader: true },
    });

    return attachments.map((attachment) => this.toResponse(attachment));
  }

  async createPresignedUpload(
    projectId: string,
    taskId: string,
    payload: PresignAttachmentDto,
  ): Promise<PresignResponse> {
    await this.ensureTaskBelongsToProject(projectId, taskId);

    const rawFileName = payload.fileName.trim();
    const sanitizedName = rawFileName
      .replaceAll(/[^\w.-]+/g, '-')
      .replaceAll(/-+/g, '-')
      .replaceAll(/^-+|-+$/g, '')
      .toLowerCase();
    const safeFileName = sanitizedName.length > 0 ? sanitizedName : 'attachment';
    const objectKey = [
      'projects',
      projectId,
      'tasks',
      taskId,
      `${randomUUID()}-${safeFileName}`.replaceAll(/-+/g, '-'),
    ].join('/');

    const contentType = payload.contentType?.trim() || 'application/octet-stream';

    const presigned = await this.storage.createPresignedUpload(objectKey, contentType);

    return {
      key: objectKey,
      uploadUrl: presigned.uploadUrl,
      headers: presigned.headers,
      expiresIn: presigned.expiresIn,
      url: this.storage.getPublicUrl(objectKey),
    };
  }

  async createAttachment(
    projectId: string,
    taskId: string,
    uploaderId: string,
    payload: CreateAttachmentDto,
  ): Promise<AttachmentResponseDto> {
    await this.ensureTaskBelongsToProject(projectId, taskId);

    const contentType = payload.contentType?.trim() || 'application/octet-stream';

    const fileName = payload.fileName.trim() || payload.fileName;

    const attachment = await this.prisma.attachment.create({
      data: {
        taskId,
        uploaderId,
        fileName,
        fileSize: payload.fileSize,
        contentType,
        s3Key: payload.s3Key,
      },
      include: { uploader: true },
    });

    return this.toResponse(attachment);
  }

  private async ensureTaskBelongsToProject(projectId: string, taskId: string): Promise<void> {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, projectId },
      select: { id: true },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }
  }

  private toResponse(attachment: Attachment & { uploader: User }): AttachmentResponseDto {
    const url = this.storage.getPublicUrl(attachment.s3Key);

    return plainToInstance(
      AttachmentResponseDto,
      {
        ...attachment,
        url,
        uploader: plainToInstance(UserSummaryDto, attachment.uploader, {
          excludeExtraneousValues: true,
        }),
      },
      { excludeExtraneousValues: true },
    );
  }
}
