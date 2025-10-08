import { Expose, Type } from 'class-transformer';

import { UserSummaryDto } from '../../common/dto/user-summary.dto';

export class AttachmentResponseDto {
  @Expose()
  id!: string;

  @Expose()
  taskId!: string;

  @Expose()
  fileName!: string;

  @Expose()
  fileSize!: number;

  @Expose()
  contentType!: string;

  @Expose()
  s3Key!: string;

  @Expose()
  url!: string | null;

  @Expose()
  createdAt!: Date;

  @Expose()
  uploaderId!: string;

  @Expose()
  @Type(() => UserSummaryDto)
  uploader!: UserSummaryDto;
}
