import { Membership } from '@prisma/client';

import { AuthenticatedRequest } from './authenticated-request';

export interface ProjectRequest extends AuthenticatedRequest {
  projectMembership?: Membership;
}
