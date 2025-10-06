import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthToken } from '@prisma/client';

import { AuthService } from './auth.service';
import { LoginRequestDto } from './dto/login-request.dto';
import { RegisterRequestDto } from './dto/register-request.dto';
import { PrismaService } from '../prisma/prisma.service';
import { PublicUser, UsersService } from '../users/users.service';

jest.mock('argon2', () => ({
  hash: jest.fn().mockResolvedValue('hashed-refresh'),
  verify: jest.fn().mockResolvedValue(true),
}));

const mockDateNow = new Date('2025-10-06T13:00:00.000Z');
const originalDateNow = Date.now;

describe('AuthService', () => {
  const usersService = {
    createUser: jest.fn(),
    findByEmail: jest.fn(),
    findById: jest.fn(),
    verifyPassword: jest.fn(),
    toPublicUser: jest.fn(),
  } as unknown as UsersService;

  const prisma = {
    authToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
  } as unknown as PrismaService;

  const jwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  } as unknown as JwtService;

  const configValues: Record<string, string> = {
    JWT_ACCESS_TOKEN_SECRET: 'access-secret',
    JWT_ACCESS_TOKEN_TTL: '900s',
    JWT_REFRESH_TOKEN_SECRET: 'refresh-secret',
    JWT_REFRESH_TOKEN_TTL: '7d',
  };

  const configService = {
    get: jest.fn((key: string) => configValues[key]),
  } as unknown as ConfigService;

  let service: AuthService;

  beforeAll(() => {
    global.Date.now = jest.fn(() => mockDateNow.getTime());
  });

  afterAll(() => {
    global.Date.now = originalDateNow;
  });

  beforeEach(() => {
    jest.clearAllMocks();

    (jwtService.signAsync as jest.Mock)
      .mockResolvedValueOnce('access-token')
      .mockResolvedValueOnce('refresh-token');

    service = new AuthService(usersService, prisma, jwtService, configService);
    (usersService.toPublicUser as jest.Mock).mockImplementation(
      (user: {
        id: string;
        email: string;
        displayName: string;
        profileColor?: string | null;
        createdAt: Date;
        updatedAt: Date;
      }): PublicUser => ({
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        profileColor: user.profileColor ?? null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }),
    );

    (prisma.authToken.deleteMany as jest.Mock).mockResolvedValue({ count: 0 });
    (prisma.authToken.create as jest.Mock).mockResolvedValue({});
  });

  const existingUser = {
    id: 'user-1',
    email: 'user@example.com',
    passwordHash: 'hashed',
    displayName: 'User',
    profileColor: '#abc',
    createdAt: mockDateNow,
    updatedAt: mockDateNow,
  };

  it('registers a new user and returns tokens', async () => {
    const payload: RegisterRequestDto = {
      email: 'user@example.com',
      password: 'Password123',
      displayName: 'User',
    };

    (usersService.createUser as jest.Mock).mockResolvedValue(existingUser);

    const result = await service.register(payload);

    expect(result).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      accessTokenExpiresIn: 900,
      user: expect.objectContaining({ id: existingUser.id, email: existingUser.email }),
    });

    expect(prisma.authToken.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: existingUser.id,
          refreshTokenHash: 'hashed-refresh',
          expiresAt: expect.any(Date),
        }),
      }),
    );
  });

  it('logs in an existing user', async () => {
    const payload: LoginRequestDto = { email: existingUser.email, password: 'Password123' };

    (usersService.findByEmail as jest.Mock).mockResolvedValue(existingUser);
    (usersService.verifyPassword as jest.Mock).mockResolvedValue(true);

    const result = await service.login(payload);

    expect(result.accessToken).toBe('access-token');
    expect(usersService.verifyPassword).toHaveBeenCalledWith(existingUser, payload.password);
  });

  it('throws on invalid login', async () => {
    const payload: LoginRequestDto = { email: existingUser.email, password: 'wrong' };

    (usersService.findByEmail as jest.Mock).mockResolvedValue(existingUser);
    (usersService.verifyPassword as jest.Mock).mockResolvedValue(false);

    await expect(service.login(payload)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('refreshes tokens when provided a valid refresh token', async () => {
    (jwtService.signAsync as jest.Mock)
      .mockResolvedValueOnce('access-token')
      .mockResolvedValueOnce('refresh-token');

    (jwtService.verifyAsync as jest.Mock).mockResolvedValue({
      sub: existingUser.id,
      jti: 'token-id',
    });
    const tokenRecord: AuthToken = {
      id: 'token-id',
      userId: existingUser.id,
      refreshTokenHash: 'hashed-refresh',
      expiresAt: new Date(mockDateNow.getTime() + 60_000),
      createdAt: mockDateNow,
    };
    (prisma.authToken.findUnique as jest.Mock).mockResolvedValue(tokenRecord);
    (usersService.findById as jest.Mock).mockResolvedValue(existingUser);

    const result = await service.refresh({ refreshToken: 'refresh-token' });

    expect(result.accessToken).toBe('access-token');
    expect(prisma.authToken.delete).toHaveBeenCalledWith({ where: { id: 'token-id' } });
    expect(prisma.authToken.create).toHaveBeenCalled();
  });

  it('rejects refresh when token is invalid', async () => {
    (jwtService.verifyAsync as jest.Mock).mockImplementation(() => {
      throw new Error('invalid');
    });

    await expect(service.refresh({ refreshToken: 'invalid' })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
