import { MembershipRole, TaskPriority, TaskStatus } from '@prisma/client';
import { Expose, Type } from 'class-transformer';

import { AttachmentResponseDto } from './attachment-response.dto';
import { UserSummaryDto } from '../../common/dto/user-summary.dto';

export class TaskAssigneeDto {
  @Expose()
  id!: string;

  @Expose()
  role!: MembershipRole;

  @Expose()
  userId!: string;

  @Expose()
  projectId!: string;

  @Expose()
  @Type(() => UserSummaryDto)
  user!: UserSummaryDto;
}

export class TaskResponseDto {
  @Expose()
  id!: string;

  @Expose()
  projectId!: string;

  @Expose()
  title!: string;

  @Expose()
  description?: string | null;

  @Expose()
  status!: TaskStatus;

  @Expose()
  priority!: TaskPriority;

  @Expose()
  dueAt?: Date | null;

  @Expose()
  position!: number;

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt!: Date;

  @Expose()
  completedAt?: Date | null;

  @Expose()
  createdById!: string;

  @Expose()
  assigneeId?: string | null;

  @Expose()
  @Type(() => UserSummaryDto)
  createdBy!: UserSummaryDto;

  @Expose()
  @Type(() => TaskAssigneeDto)
  assignee?: TaskAssigneeDto | null;

  @Expose()
  @Type(() => AttachmentResponseDto)
  attachments!: AttachmentResponseDto[];
}
