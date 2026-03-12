/**
 * Contrôleur auth : login, GET /me, inscription, validation email, profil (PATCH /me),
 * mot de passe oublié et réinitialisation par token.
 */
import { Controller, Post, Get, Patch, Body, UseGuards, Request, Query } from '@nestjs/common';
import { JwtAuthGuard } from './infrastructure/jwt-auth.guard';
import { LoginUseCase } from './application/login.use-case';
import { GetMeUseCase } from './application/get-me.use-case';
import { LoginDto } from './dto/login.dto';
import type { Request as ExpressRequest } from 'express';
import { RegisterUseCase } from './application/register.use-case';
import { VerifyEmailUseCase } from './application/verify-email.use-case';
import { UpdateProfileUseCase } from './application/update-profile.use-case';
import { RequestPasswordResetUseCase } from './application/request-password-reset.use-case';
import { ResetPasswordUseCase } from './application/reset-password.use-case';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

type AuthRequest = ExpressRequest & { user: { userId: string; email: string; role: string } };

@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly getMeUseCase: GetMeUseCase,
    private readonly registerUseCase: RegisterUseCase,
    private readonly verifyEmailUseCase: VerifyEmailUseCase,
    private readonly updateProfileUseCase: UpdateProfileUseCase,
    private readonly requestPasswordResetUseCase: RequestPasswordResetUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
  ) {}

  // ——— Session : login et profil courant
  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.loginUseCase.run(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@Request() req: AuthRequest) {
    return this.getMeUseCase.run(req.user.userId);
  }

  // ——— Inscription et validation email
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.registerUseCase.run(dto);
  }

  @Get('verify-email')
  async verifyEmail(@Query('token') token: string) {
    return this.verifyEmailUseCase.run(token);
  }

  // ——— Profil et mot de passe
  @Patch('me')
  @UseGuards(JwtAuthGuard)
  async updateProfile(@Request() req: AuthRequest, @Body() dto: UpdateProfileDto) {
    return this.updateProfileUseCase.run(req.user.userId, dto);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() dto: RequestPasswordResetDto) {
    return this.requestPasswordResetUseCase.run(dto);
  }

  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.resetPasswordUseCase.run(dto);
  }
}
