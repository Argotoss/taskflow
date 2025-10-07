import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { MembershipRole } from '@prisma/client';
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

import { testProject } from './fixtures/test-data';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { ProjectAccessGuard } from '../src/projects/guards/project-access.guard';
import { ProjectsController } from '../src/projects/projects.controller';
import { ProjectsService } from '../src/projects/projects.service';

describe('ProjectsController (e2e)', () => {
  let app: INestApplication;

  const projectsService: Record<string, jest.Mock> = {
    listProjectsForUser: jest.fn().mockResolvedValue([testProject]),
    createProject: jest.fn().mockResolvedValue(testProject),
    getProjectForUser: jest.fn().mockResolvedValue(testProject),
    updateProject: jest.fn().mockResolvedValue(testProject),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ProjectsController],
      providers: [
        { provide: ProjectsService, useValue: projectsService },
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

  it('lists projects for the current user', async () => {
    const response = await request(app.getHttpServer()).get('/projects').expect(200);

    expect(response.body).toEqual([
      expect.objectContaining({
        id: testProject.id,
        name: testProject.name,
        role: testProject.role,
      }),
    ]);
    expect(projectsService.listProjectsForUser).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({}),
    );
  });

  it('creates a project', async () => {
    await request(app.getHttpServer())
      .post('/projects')
      .send({ name: 'New Project', description: 'Something' })
      .expect(201);

    expect(projectsService.createProject).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ name: 'New Project' }),
    );
  });

  it('retrieves a project by id', async () => {
    await request(app.getHttpServer()).get(`/projects/${testProject.id}`).expect(200);

    expect(projectsService.getProjectForUser).toHaveBeenCalledWith(testProject.id, 'user-1');
  });

  it('updates a project with admin privileges', async () => {
    await request(app.getHttpServer())
      .patch(`/projects/${testProject.id}`)
      .send({ status: 'ARCHIVED' })
      .expect(200);

    expect(projectsService.updateProject).toHaveBeenCalledWith(
      testProject.id,
      expect.objectContaining({ status: 'ARCHIVED' }),
      MembershipRole.OWNER,
    );
  });
});
