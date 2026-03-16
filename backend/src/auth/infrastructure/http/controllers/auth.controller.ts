/**
 * Contrôleur auth : login, GET /me, inscription, validation email, profil (PATCH /me),
 * mot de passe oublié et réinitialisation par token.
 * Les erreurs du domaine sont mappées vers les codes HTTP dans cette couche.
 */
import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  UseGuards,
  Request,
  Query,
  Res,
} from '@nestjs/common';
import type { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { LoginUseCase } from '../../../application/use-cases/login.use-case';
import { GetMeUseCase } from '../../../application/use-cases/get-me.use-case';
import { RegisterUseCase } from '../../../application/use-cases/register.use-case';
import { VerifyEmailUseCase } from '../../../application/use-cases/verify-email.use-case';
import { UpdateProfileUseCase } from '../../../application/use-cases/update-profile.use-case';
import { RequestPasswordResetUseCase } from '../../../application/use-cases/request-password-reset.use-case';
import { ResetPasswordUseCase } from '../../../application/use-cases/reset-password.use-case';
import { ChangePasswordUseCase } from '../../../application/use-cases/change-password.use-case';
import { LoginDto } from '../../../application/dtos/login.dto';
import { RegisterDto } from '../../../application/dtos/register.dto';
import { UpdateProfileDto } from '../../../application/dtos/update-profile.dto';
import { RequestPasswordResetDto } from '../../../application/dtos/request-password-reset.dto';
import { ResetPasswordDto } from '../../../application/dtos/reset-password.dto';
import { ChangePasswordDto } from '../../../application/dtos/change-password.dto';
import { AUTH_PREFIX, AUTH_ROUTES } from '../routes/auth.routes';
import { mapAuthDomainErrorToHttp } from '../middlewares/auth-error-mapper';

type AuthRequest = ExpressRequest & {
  user: { userId: string; email: string; role: string };
};

@Controller(AUTH_PREFIX)
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly getMeUseCase: GetMeUseCase,
    private readonly registerUseCase: RegisterUseCase,
    private readonly verifyEmailUseCase: VerifyEmailUseCase,
    private readonly updateProfileUseCase: UpdateProfileUseCase,
    private readonly requestPasswordResetUseCase: RequestPasswordResetUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
    private readonly changePasswordUseCase: ChangePasswordUseCase,
  ) {}

  @Post(AUTH_ROUTES.LOGIN)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: ExpressResponse) {
    try {
      const { access_token } = await this.loginUseCase.run(dto);
      const isProd = process.env.NODE_ENV === 'production';

      res.cookie('access_token', access_token, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'strict' : 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      // Retour du token pour compatibilité éventuelle des tests,
      // mais le front doit se baser sur le cookie httpOnly.
      return { access_token };
    } catch (err) {
      mapAuthDomainErrorToHttp(err);
    }
  }

  @Post(AUTH_ROUTES.LOGOUT)
  async logout(@Res({ passthrough: true }) res: ExpressResponse) {
    const isProd = process.env.NODE_ENV === 'production';
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'strict' : 'lax',
      path: '/',
    });
    return { success: true };
  }

  @Get(AUTH_ROUTES.ME)
  @UseGuards(JwtAuthGuard)
  async me(@Request() req: AuthRequest) {
    try {
      return await this.getMeUseCase.run(req.user.userId);
    } catch (err) {
      mapAuthDomainErrorToHttp(err);
    }
  }

  @Post(AUTH_ROUTES.REGISTER)
  async register(@Body() dto: RegisterDto) {
    try {
      return await this.registerUseCase.run(dto);
    } catch (err) {
      mapAuthDomainErrorToHttp(err);
    }
  }

  @Get(AUTH_ROUTES.VERIFY_EMAIL)
  async verifyEmail(@Query('token') token: string) {
    try {
      return await this.verifyEmailUseCase.run(token);
    } catch (err) {
      mapAuthDomainErrorToHttp(err);
    }
  }

  @Patch(AUTH_ROUTES.UPDATE_PROFILE)
  @UseGuards(JwtAuthGuard)
  async updateProfile(@Request() req: AuthRequest, @Body() dto: UpdateProfileDto) {
    try {
      return await this.updateProfileUseCase.run(req.user.userId, dto);
    } catch (err) {
      mapAuthDomainErrorToHttp(err);
    }
  }

  @Post(AUTH_ROUTES.CHANGE_PASSWORD)
  @UseGuards(JwtAuthGuard)
  async changePassword(@Request() req: AuthRequest, @Body() dto: ChangePasswordDto) {
    try {
      return await this.changePasswordUseCase.run(req.user.userId, dto);
    } catch (err) {
      mapAuthDomainErrorToHttp(err);
    }
  }

  @Post(AUTH_ROUTES.FORGOT_PASSWORD)
  async forgotPassword(@Body() dto: RequestPasswordResetDto) {
    try {
      return await this.requestPasswordResetUseCase.run(dto);
    } catch (err) {
      mapAuthDomainErrorToHttp(err);
    }
  }

  @Post(AUTH_ROUTES.RESET_PASSWORD)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    try {
      return await this.resetPasswordUseCase.run(dto);
    } catch (err) {
      mapAuthDomainErrorToHttp(err);
    }
  }
}
