import { MembershipRole } from '@prisma/client';
import { IsEmail, IsEnum, IsOptional } from 'class-validator';

export class AddMemberDto {
  @IsEmail()
  email!: string;

  @IsEnum(MembershipRole)
  @IsOptional()
  role?: MembershipRole;
}
