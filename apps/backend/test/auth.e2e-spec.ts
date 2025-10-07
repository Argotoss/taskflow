import { ExecutionContext, INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { User } from '@prisma/client';
import request from 'supertest';

import { AuthModule } from '../src/auth/auth.module';
import { AuthService } from '../src/auth/auth.service';
import { AuthResponseDto } from '../src/auth/dto/auth-response.dto';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../src/common/types/authenticated-request';
import { PublicUser, UsersService } from '../src/users/users.service';

const mockTokens: AuthResponseDto = {
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  accessTokenExpiresIn: 900,
  user: {
    id: 'user-1',
    email: 'user@example.com',
    displayName: 'User',
    profileColor: '#123456',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
};

describe('AuthModule (e2e)', () => {
  let app: INestApplication;
  const storedUser: User = {
    id: 'user-1',
    email: 'user@example.com',
    passwordHash: 'hash',
    displayName: 'User',
    profileColor: '#123456',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const usersService: Pick<UsersService, 'findById' | 'toPublicUser'> = {
    findById: jest.fn(async () => storedUser),
    toPublicUser: jest.fn(
      () =>
        ({
          id: storedUser.id,
          email: storedUser.email,
          displayName: storedUser.displayName,
          profileColor: storedUser.profileColor,
          createdAt: storedUser.createdAt,
          updatedAt: storedUser.updatedAt,
        }) satisfies PublicUser,
    ),
  };

  const authService: Partial<AuthService> = {
    register: jest.fn(async () => mockTokens),
    login: jest.fn(async () => mockTokens),
    refresh: jest.fn(async () => mockTokens),
  };

  beforeAll(async () => {
    delete process.env.DATABASE_URL;

    const module = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), AuthModule],
    })
      .overrideProvider(AuthService)
      .useValue(authService)
      .overrideProvider(UsersService)
      .useValue(usersService)
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
          req.user = { userId: storedUser.id };
          return true;
        },
      })
      .compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('registers a user', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'fresh@example.com',
        password: 'Password123',
        displayName: 'Fresh User',
      })
      .expect(201);

    expect(response.body.accessToken).toBe(mockTokens.accessToken);
    expect(authService.register).toHaveBeenCalled();
  });

  it('logs in and refreshes tokens', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'user@example.com', password: 'Password123' })
      .expect(200);

    expect(loginResponse.body.refreshToken).toBe(mockTokens.refreshToken);

    const refreshResponse = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: mockTokens.refreshToken })
      .expect(200);

    expect(refreshResponse.body.accessToken).toBe(mockTokens.accessToken);
  });

  it('returns current user data', async () => {
    const response = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', 'Bearer any-token')
      .expect(200);

    expect(response.body).toMatchObject({
      id: 'user-1',
      email: 'user@example.com',
      displayName: 'User',
    });
  });
});
