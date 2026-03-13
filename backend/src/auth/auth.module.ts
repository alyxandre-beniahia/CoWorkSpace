import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { JwtAuthGuard } from './infrastructure/jwt-auth.guard';
import { LoginUseCase } from './application/login.use-case';
import { GetMeUseCase } from './application/get-me.use-case';
import { RegisterUseCase } from './application/register.use-case';
import { VerifyEmailUseCase } from './application/verify-email.use-case';
import { UpdateProfileUseCase } from './application/update-profile.use-case';
import { RequestPasswordResetUseCase } from './application/request-password-reset.use-case';
import { ResetPasswordUseCase } from './application/reset-password.use-case';
import { ChangePasswordUseCase } from './application/change-password.use-case';
import { JwtStrategy } from './infrastructure/jwt.strategy';
import { AdminGuard } from './infrastructure/admin.guard';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    NotificationModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'dev-secret-change-in-prod',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    JwtAuthGuard,
    AdminGuard,
    LoginUseCase,
    GetMeUseCase,
    RegisterUseCase,
    VerifyEmailUseCase,
    UpdateProfileUseCase,
    RequestPasswordResetUseCase,
    ResetPasswordUseCase,
    ChangePasswordUseCase,
    JwtStrategy,
  ],
  exports: [JwtModule, JwtAuthGuard, AdminGuard],
})
export class AuthModule {}
