import { ProjectStatus } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

export class ListProjectsQueryDto {
  @IsEnum(ProjectStatus)
  @IsOptional()
  status?: ProjectStatus;
}
