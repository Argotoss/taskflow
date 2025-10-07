import { MembershipRole, PrismaClient, TaskPriority, TaskStatus } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const password = process.env.SEED_USER_PASSWORD ?? 'Password123!';
  const passwordHash = await argon2.hash(password);

  const user = await prisma.user.upsert({
    where: { email: 'founder@taskflow.dev' },
    update: {},
    create: {
      email: 'founder@taskflow.dev',
      passwordHash,
      displayName: 'Daniil Kozak',
      profileColor: '#2563eb',
    },
  });

  const project = await prisma.project.upsert({
    where: { id: '11111111-1111-1111-1111-111111111111' },
    update: {},
    create: {
      id: '11111111-1111-1111-1111-111111111111',
      name: 'TaskFlow Demo Workspace',
      description: 'Sample project seeded for local development.',
      ownerId: user.id,
    },
  });

  await prisma.membership.upsert({
    where: {
      userId_projectId: {
        userId: user.id,
        projectId: project.id,
      },
    },
    update: {
      role: MembershipRole.OWNER,
    },
    create: {
      userId: user.id,
      projectId: project.id,
      role: MembershipRole.OWNER,
    },
  });

  const tasks = [
    {
      id: '44444444-4444-4444-4444-444444444440',
      title: 'Wire up authentication flow',
      description: 'Implement login, register, and refresh endpoints with guarded project routes.',
      priority: TaskPriority.HIGH,
      status: TaskStatus.IN_PROGRESS,
    },
    {
      id: '44444444-4444-4444-4444-444444444441',
      title: 'Design kanban board UI',
      description: 'Create backlog, in progress, review, and done swim lanes in the frontend.',
      priority: TaskPriority.MEDIUM,
      status: TaskStatus.BACKLOG,
    },
    {
      id: '44444444-4444-4444-4444-444444444442',
      title: 'Set up CI pipeline',
      description: 'Add lint, test, and deployment stages with GitHub Actions.',
      priority: TaskPriority.MEDIUM,
      status: TaskStatus.BACKLOG,
    },
  ];

  for (const [index, task] of tasks.entries()) {
    const { id, ...taskData } = task;
    await prisma.task.upsert({
      where: { id },
      update: {
        ...taskData,
        position: index,
      },
      create: {
        projectId: project.id,
        createdById: user.id,
        id,
        ...taskData,
        position: index,
      },
    });
  }

  await prisma.authToken.deleteMany({
    where: { userId: user.id },
  });

  console.log('Seed complete');
  console.log(`Seed user email: ${user.email}`);
  console.log(`Seed user password: ${password}`);
}

void main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
