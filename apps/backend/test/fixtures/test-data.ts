import { MembershipRole, TaskPriority, TaskStatus } from '@prisma/client';

import { UserSummaryDto } from '../../src/common/dto/user-summary.dto';
import { MembershipResponseDto } from '../../src/memberships/dto/membership-response.dto';
import { ProjectResponseDto } from '../../src/projects/dto/project-response.dto';
import { TaskResponseDto } from '../../src/tasks/dto/task-response.dto';

const timestamp = new Date('2025-01-01T00:00:00.000Z');

export const testUser: UserSummaryDto = {
  id: 'user-1',
  email: 'user@example.com',
  displayName: 'Test User',
  profileColor: '#2563eb',
  createdAt: timestamp,
  updatedAt: timestamp,
};

export const testProject: ProjectResponseDto = {
  id: 'project-1',
  name: 'Workspace Alpha',
  description: 'A demo project used in e2e tests.',
  status: 'ACTIVE',
  role: MembershipRole.OWNER,
  ownerId: 'user-1',
  createdAt: timestamp,
  updatedAt: timestamp,
  archivedAt: null,
};

export const testMembership: MembershipResponseDto = {
  id: 'membership-1',
  projectId: testProject.id,
  userId: testUser.id,
  role: MembershipRole.ADMIN,
  joinedAt: timestamp,
  invitedById: null,
  user: testUser,
};

export const testTask: TaskResponseDto = {
  id: 'task-1',
  projectId: testProject.id,
  title: 'Draft API specs',
  description: 'Create OpenAPI docs for core endpoints.',
  status: TaskStatus.BACKLOG,
  priority: TaskPriority.HIGH,
  dueAt: null,
  position: 1,
  createdAt: timestamp,
  updatedAt: timestamp,
  completedAt: null,
  createdById: testUser.id,
  assigneeId: testMembership.id,
  createdBy: testUser,
  assignee: {
    id: testMembership.id,
    projectId: testProject.id,
    userId: testUser.id,
    role: testMembership.role,
    user: testUser,
  },
};
