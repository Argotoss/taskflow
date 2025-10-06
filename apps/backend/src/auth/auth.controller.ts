import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';

import { AuthService } from './auth.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginRequestDto } from './dto/login-request.dto';
import { RefreshTokenRequestDto } from './dto/refresh-token-request.dto';
import { RegisterRequestDto } from './dto/register-request.dto';

@Controller({ path: 'auth' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
}
