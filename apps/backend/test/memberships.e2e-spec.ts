import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

jest.mock('../src/auth/guards/jwt-auth.guard', () => {
  return {
    JwtAuthGuard: class {
      canActivate(context: import('@nestjs/common').ExecutionContext): boolean {
        const req = context.switchToHttp().getRequest();
        req.user = { userId: 'user-1' };
        return true;
      }
    },
  };
});

jest.mock('../src/projects/guards/project-access.guard', () => {
  return {
    ProjectAccessGuard: class {
      canActivate(context: import('@nestjs/common').ExecutionContext): boolean {
        const req = context.switchToHttp().getRequest();
        const projectId = req.params?.projectId ?? 'project-1';
        const userId = req.user?.userId ?? 'user-1';
        req.projectMembership = {
          id: 'membership-1',
          projectId,
          userId,
          role: 'OWNER',
          joinedAt: new Date(),
          invitedById: null,
        };
        return true;
      }
    },
  };
});

import { testMembership } from './fixtures/test-data';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { MembershipsController } from '../src/memberships/memberships.controller';
import { MembershipsService } from '../src/memberships/memberships.service';
import { ProjectAccessGuard } from '../src/projects/guards/project-access.guard';

describe('MembershipsController (e2e)', () => {
  let app: INestApplication;

  const membershipsService: Record<string, jest.Mock> = {
    listMembers: jest.fn().mockResolvedValue([testMembership]),
    addMember: jest.fn().mockResolvedValue(testMembership),
    updateMemberRole: jest.fn().mockResolvedValue(testMembership),
    removeMember: jest.fn().mockResolvedValue(null),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [MembershipsController],
      providers: [
        { provide: MembershipsService, useValue: membershipsService },
        JwtAuthGuard,
        ProjectAccessGuard,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists project memberships', async () => {
    const response = await request(app.getHttpServer())
      .get(`/projects/${testMembership.projectId}/memberships`)
      .expect(200);

    expect(response.body[0]).toMatchObject({ id: testMembership.id, role: testMembership.role });
    expect(membershipsService.listMembers).toHaveBeenCalledWith(testMembership.projectId);
  });

  it('adds a member', async () => {
    await request(app.getHttpServer())
      .post(`/projects/${testMembership.projectId}/memberships`)
      .send({ email: 'new@example.com', role: 'ADMIN' })
      .expect(201);

    expect(membershipsService.addMember).toHaveBeenCalledWith(
      testMembership.projectId,
      testMembership.userId,
      expect.objectContaining({ email: 'new@example.com' }),
    );
  });

  it('updates a member role', async () => {
    await request(app.getHttpServer())
      .patch(`/projects/${testMembership.projectId}/memberships/${testMembership.id}`)
      .send({ role: 'ADMIN' })
      .expect(200);

    expect(membershipsService.updateMemberRole).toHaveBeenCalledWith(
      testMembership.projectId,
      testMembership.id,
      expect.objectContaining({ role: 'ADMIN' }),
    );
  });

  it('removes a member', async () => {
    await request(app.getHttpServer())
      .delete(`/projects/${testMembership.projectId}/memberships/${testMembership.id}`)
      .expect(200);

    expect(membershipsService.removeMember).toHaveBeenCalledWith(
      testMembership.projectId,
      testMembership.id,
    );
  });
});
