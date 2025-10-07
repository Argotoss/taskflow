import { MembershipRole } from '@prisma/client';
import { Expose, Type } from 'class-transformer';

import { UserSummaryDto } from '../../common/dto/user-summary.dto';

export class MembershipResponseDto {
  @Expose()
  id!: string;

  @Expose()
  role!: MembershipRole;

  @Expose()
  joinedAt!: Date;

  @Expose()
  invitedById?: string | null;

  @Expose()
  projectId!: string;

  @Expose()
  userId!: string;

  @Expose()
  @Type(() => UserSummaryDto)
  user!: UserSummaryDto;
}
