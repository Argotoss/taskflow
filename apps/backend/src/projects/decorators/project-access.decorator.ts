import { SetMetadata } from '@nestjs/common';
import { MembershipRole } from '@prisma/client';

export const PROJECT_ACCESS_KEY = 'project:access';

export const ProjectAccess = (...roles: MembershipRole[]) => SetMetadata(PROJECT_ACCESS_KEY, roles);
