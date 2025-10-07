import { PartialType } from '@nestjs/mapped-types';
import { ProjectStatus } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

import { CreateProjectDto } from './create-project.dto';

export class UpdateProjectDto extends PartialType(CreateProjectDto) {
  @IsEnum(ProjectStatus)
  @IsOptional()
  status?: ProjectStatus;
}
