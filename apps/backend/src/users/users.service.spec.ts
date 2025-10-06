import { ConflictException } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';

import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';

const now = new Date();

describe('UsersService', () => {
  const prisma = {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
  } as unknown as PrismaService;

  let service: UsersService;

  beforeEach(() => {
    jest.resetAllMocks();
    service = new UsersService(prisma);
  });

  it('hashes the password on create', async () => {
    const input = {
      email: 'user@example.com',
      password: 'Password123',
      displayName: 'Example User',
    };

    const createdUser = {
      id: 'user-id',
      email: input.email,
      passwordHash: 'hashed-value',
      displayName: input.displayName,
      profileColor: null,
      createdAt: now,
      updatedAt: now,
    };

    (prisma.user.create as jest.Mock).mockImplementation(async ({ data }) => {
      expect(data.passwordHash).not.toEqual(input.password);
      return createdUser;
    });

    const user = await service.createUser(input);

    expect(user).toEqual(createdUser);
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: input.email.toLowerCase(),
        displayName: input.displayName,
      }),
    });
  });

  it('throws when email already exists', async () => {
    const input = {
      email: 'duplicate@example.com',
      password: 'Password123',
      displayName: 'Duplicate',
    };

    (prisma.user.create as jest.Mock).mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint', {
        code: 'P2002',
        clientVersion: '5.22.0',
      }),
    );

    await expect(service.createUser(input)).rejects.toBeInstanceOf(ConflictException);
  });

  it('converts user to public representation', () => {
    const user: User = {
      id: 'user-1',
      email: 'user@example.com',
      passwordHash: 'secret',
      displayName: 'Example',
      profileColor: '#fff',
      createdAt: now,
      updatedAt: now,
    };

    const publicUser = service.toPublicUser(user);

    expect(publicUser).toEqual({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      profileColor: user.profileColor,
      createdAt: now,
      updatedAt: now,
    });
  });
});
