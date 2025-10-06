import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import * as argon2 from 'argon2';

import { PrismaService } from '../prisma/prisma.service';
import { CreateUserInput } from './dto/create-user.input';

export type PublicUser = Pick<
  User,
  'id' | 'email' | 'displayName' | 'profileColor' | 'createdAt' | 'updatedAt'
>;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async createUser(input: CreateUserInput): Promise<User> {
    const passwordHash = await argon2.hash(input.password);

    try {
      return await this.prisma.user.create({
        data: {
          email: input.email.toLowerCase(),
          passwordHash,
          displayName: input.displayName,
          profileColor: input.profileColor,
        },
      });
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('Email already in use');
      }

      throw error;
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async verifyPassword(user: Pick<User, 'passwordHash'>, plain: string): Promise<boolean> {
    return argon2.verify(user.passwordHash, plain);
  }

  toPublicUser(user: User): PublicUser {
    const { id, email, displayName, profileColor, createdAt, updatedAt } = user;
    return { id, email, displayName, profileColor, createdAt, updatedAt };
  }

  private isUniqueConstraintError(error: unknown): boolean {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
  }
}
