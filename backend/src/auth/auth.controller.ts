import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from './infrastructure/jwt-auth.guard';
import { LoginUseCase } from './application/login.use-case';
import { GetMeUseCase } from './application/get-me.use-case';
import { LoginDto } from './dto/login.dto';
import type { Request as ExpressRequest } from 'express';

type AuthRequest = ExpressRequest & { user: { userId: string; email: string; role: string } };

@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly getMeUseCase: GetMeUseCase,
  ) {}

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.loginUseCase.run(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@Request() req: AuthRequest) {
    return this.getMeUseCase.run(req.user.userId);
  }
}
