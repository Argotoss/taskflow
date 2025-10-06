import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import * as argon2 from 'argon2';
import ms from 'ms';
import { randomUUID } from 'node:crypto';

import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginRequestDto } from './dto/login-request.dto';
import { RefreshTokenRequestDto } from './dto/refresh-token-request.dto';
import { RegisterRequestDto } from './dto/register-request.dto';

interface TokensPayload {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: number;
}

@Injectable()
export class AuthService {
  private readonly accessTokenSecret: string;
  private readonly accessTokenTtl: string;
  private readonly accessTokenTtlMs: number;
  private readonly refreshTokenSecret: string;
  private readonly refreshTokenTtl: string;
  private readonly refreshTokenTtlMs: number;

  constructor(
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    configService: ConfigService,
  ) {
    this.accessTokenSecret =
      configService.get<string>('JWT_ACCESS_TOKEN_SECRET') ?? 'access-secret';
    this.accessTokenTtl = configService.get<string>('JWT_ACCESS_TOKEN_TTL') ?? '900s';
    this.accessTokenTtlMs = this.toMilliseconds(this.accessTokenTtl);

    this.refreshTokenSecret =
      configService.get<string>('JWT_REFRESH_TOKEN_SECRET') ?? 'refresh-secret';
    this.refreshTokenTtl = configService.get<string>('JWT_REFRESH_TOKEN_TTL') ?? '7d';
    this.refreshTokenTtlMs = this.toMilliseconds(this.refreshTokenTtl);
  }

  async register(payload: RegisterRequestDto): Promise<AuthResponseDto> {
    const user = await this.usersService.createUser({
      email: payload.email,
      password: payload.password,
      displayName: payload.displayName,
      profileColor: payload.profileColor,
    });

    return this.buildAuthResponse(user);
  }

  async login(payload: LoginRequestDto): Promise<AuthResponseDto> {
    const user = await this.usersService.findByEmail(payload.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await this.usersService.verifyPassword(user, payload.password);

    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.buildAuthResponse(user);
  }

  async refresh(payload: RefreshTokenRequestDto): Promise<AuthResponseDto> {
    const decoded = await this.verifyRefreshToken(payload.refreshToken);
    const tokenRecord = await this.prisma.authToken.findUnique({ where: { id: decoded.jti } });

    if (!tokenRecord) {
      throw new UnauthorizedException('Refresh token revoked');
    }

    if (tokenRecord.expiresAt.getTime() <= Date.now()) {
      await this.prisma.authToken.delete({ where: { id: tokenRecord.id } });
      throw new UnauthorizedException('Refresh token expired');
    }

    const isMatch = await argon2.verify(tokenRecord.refreshTokenHash, payload.refreshToken);

    if (!isMatch) {
      await this.prisma.authToken.delete({ where: { id: tokenRecord.id } });
      throw new UnauthorizedException('Refresh token revoked');
    }

    await this.prisma.authToken.delete({ where: { id: tokenRecord.id } });

    const user = await this.usersService.findById(decoded.sub);

    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }

    return this.buildAuthResponse(user);
  }

  private async buildAuthResponse(user: User): Promise<AuthResponseDto> {
    await this.prisma.authToken.deleteMany({
      where: { userId: user.id, expiresAt: { lt: new Date() } },
    });

    const tokens = await this.issueTokens(user.id);
    const publicUser = this.usersService.toPublicUser(user);

    return {
      ...tokens,
      user: publicUser,
    };
  }

  private async issueTokens(userId: string): Promise<TokensPayload> {
    const accessTokenPromise = this.jwtService.signAsync(
      { sub: userId },
      { secret: this.accessTokenSecret, expiresIn: this.accessTokenTtl },
    );

    const jti = randomUUID();
    const refreshTokenPromise = this.jwtService.signAsync(
      { sub: userId },
      { secret: this.refreshTokenSecret, expiresIn: this.refreshTokenTtl, jwtid: jti },
    );

    const [accessToken, refreshToken] = await Promise.all([
      accessTokenPromise,
      refreshTokenPromise,
    ]);
    const expiresAt = new Date(Date.now() + this.refreshTokenTtlMs);
    const refreshTokenHash = await argon2.hash(refreshToken);

    await this.prisma.authToken.create({
      data: {
        id: jti,
        userId,
        refreshTokenHash,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      accessTokenExpiresIn: Math.floor(this.accessTokenTtlMs / 1000),
    };
  }

  private async verifyRefreshToken(token: string): Promise<{ sub: string; jti: string }> {
    try {
      const payload = await this.jwtService.verifyAsync<{ sub: string; jti: string }>(token, {
        secret: this.refreshTokenSecret,
      });

      if (!payload?.sub || !payload?.jti) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return payload;
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private toMilliseconds(value: string): number {
    const resolved = ms(value);

    if (typeof resolved !== 'number') {
      throw new TypeError(`Invalid duration: ${value}`);
    }

    return resolved;
  }
}
