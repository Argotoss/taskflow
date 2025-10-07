import { MembershipRole, ProjectStatus } from '@prisma/client';
import { Expose } from 'class-transformer';

export class ProjectResponseDto {
  @Expose()
  id!: string;

  @Expose()
  name!: string;

  @Expose()
  description?: string | null;

  @Expose()
  status!: ProjectStatus;

  @Expose()
  role!: MembershipRole;

  @Expose()
  ownerId!: string;

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt!: Date;

  @Expose()
  archivedAt?: Date | null;
}
