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

import { testTask } from './fixtures/test-data';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { ProjectAccessGuard } from '../src/projects/guards/project-access.guard';
import { TasksController } from '../src/tasks/tasks.controller';
import { TasksService } from '../src/tasks/tasks.service';

describe('TasksController (e2e)', () => {
  let app: INestApplication;

  const tasksService: Record<string, jest.Mock> = {
    listTasks: jest.fn().mockResolvedValue([testTask]),
    createTask: jest.fn().mockResolvedValue(testTask),
    getTask: jest.fn().mockResolvedValue(testTask),
    updateTask: jest.fn().mockResolvedValue(testTask),
    deleteTask: jest.fn().mockResolvedValue(null),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [
        { provide: TasksService, useValue: tasksService },
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

  it('lists tasks for a project', async () => {
    const response = await request(app.getHttpServer())
      .get(`/projects/${testTask.projectId}/tasks`)
      .expect(200);

    expect(response.body).toEqual([
      expect.objectContaining({
        id: testTask.id,
        title: testTask.title,
      }),
    ]);
    expect(tasksService.listTasks).toHaveBeenCalledWith(
      testTask.projectId,
      expect.objectContaining({}),
    );
  });

  it('creates a task with contributor access', async () => {
    await request(app.getHttpServer())
      .post(`/projects/${testTask.projectId}/tasks`)
      .send({ title: 'New Task' })
      .expect(201);

    expect(tasksService.createTask).toHaveBeenCalledWith(
      testTask.projectId,
      'user-1',
      expect.objectContaining({ title: 'New Task' }),
    );
  });

  it('retrieves a task', async () => {
    await request(app.getHttpServer())
      .get(`/projects/${testTask.projectId}/tasks/${testTask.id}`)
      .expect(200);

    expect(tasksService.getTask).toHaveBeenCalledWith(testTask.projectId, testTask.id);
  });

  it('updates a task', async () => {
    await request(app.getHttpServer())
      .patch(`/projects/${testTask.projectId}/tasks/${testTask.id}`)
      .send({ status: 'IN_PROGRESS' })
      .expect(200);

    expect(tasksService.updateTask).toHaveBeenCalledWith(
      testTask.projectId,
      testTask.id,
      expect.objectContaining({ status: 'IN_PROGRESS' }),
    );
  });

  it('deletes a task', async () => {
    await request(app.getHttpServer())
      .delete(`/projects/${testTask.projectId}/tasks/${testTask.id}`)
      .expect(200);

    expect(tasksService.deleteTask).toHaveBeenCalledWith(testTask.projectId, testTask.id);
  });
});
