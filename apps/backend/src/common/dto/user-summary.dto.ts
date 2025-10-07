import { Expose } from 'class-transformer';

export class UserSummaryDto {
  @Expose()
  id!: string;

  @Expose()
  email!: string;

  @Expose()
  displayName!: string;

  @Expose()
  profileColor?: string | null;

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt!: Date;
}
