import { UnauthorizedException } from '@nestjs/common';

import { AuthController, AuthenticatedRequest } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersService, PublicUser } from '../users/users.service';

describe('AuthController', () => {
  const authService = {
    register: jest.fn(),
    login: jest.fn(),
    refresh: jest.fn(),
  } as unknown as AuthService;

  const usersService = {
    findById: jest.fn(),
    toPublicUser: jest.fn(),
  } as unknown as UsersService;

  let controller: AuthController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new AuthController(authService, usersService);
  });

  it('returns the current user profile', async () => {
    const userId = 'user-1';
    const user = {
      id: userId,
      email: 'user@example.com',
      displayName: 'User',
      profileColor: '#123456',
      passwordHash: 'hash',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const publicUser: PublicUser = {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      profileColor: user.profileColor,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    (usersService.findById as jest.Mock).mockResolvedValue(user);
    (usersService.toPublicUser as jest.Mock).mockReturnValue(publicUser);

    const request: AuthenticatedRequest = { user: { userId } };
    const result = await controller.me(request);

    expect(result).toEqual(publicUser);
    expect(usersService.findById).toHaveBeenCalledWith(userId);
  });

  it('throws when user cannot be resolved', async () => {
    (usersService.findById as jest.Mock).mockResolvedValue(null);

    const request: AuthenticatedRequest = { user: { userId: 'missing' } };

    await expect(controller.me(request)).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
