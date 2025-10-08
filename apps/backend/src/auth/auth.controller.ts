import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';

import { AuthService } from './auth.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginRequestDto } from './dto/login-request.dto';
import { RefreshTokenRequestDto } from './dto/refresh-token-request.dto';
import { RegisterRequestDto } from './dto/register-request.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../common/types/authenticated-request';
import { PublicUser, UsersService } from '../users/users.service';

@ApiTags('auth')
@Controller({ path: 'auth' })
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('register')
  async register(@Body() payload: RegisterRequestDto): Promise<AuthResponseDto> {
    const response = await this.authService.register(payload);
    return plainToInstance(AuthResponseDto, response, { excludeExtraneousValues: true });
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() payload: LoginRequestDto): Promise<AuthResponseDto> {
    const response = await this.authService.login(payload);
    return plainToInstance(AuthResponseDto, response, { excludeExtraneousValues: true });
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() payload: RefreshTokenRequestDto): Promise<AuthResponseDto> {
    const response = await this.authService.refresh(payload);
    return plainToInstance(AuthResponseDto, response, { excludeExtraneousValues: true });
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async me(@Request() req: AuthenticatedRequest): Promise<PublicUser> {
    const userId = req.user.userId;
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new UnauthorizedException('Authenticated user not found');
    }

    return this.usersService.toPublicUser(user);
  }
}
