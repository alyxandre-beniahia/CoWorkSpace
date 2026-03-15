import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from '../database/prisma.module';
import { AuthController } from './infrastructure/http/controllers/auth.controller';
import { JwtAuthGuard } from '../shared/guards/jwt-auth.guard';
import { AdminGuard } from '../shared/guards/admin.guard';
import { JwtStrategy } from './infrastructure/http/strategies/jwt.strategy';
import { UserRepository } from './infrastructure/repositories/user.repository';
import { JwtAuthTokenService } from './infrastructure/adapters/jwt-auth-token.service';
import { AuthEmailSenderAdapter } from './infrastructure/adapters/auth-email-sender.adapter';
import { AvatarUrlAdapter } from './infrastructure/adapters/avatar-url.adapter';
import { BcryptPasswordHasherAdapter } from './infrastructure/adapters/bcrypt-password-hasher.adapter';
import { CryptoTokenGeneratorAdapter } from './infrastructure/adapters/crypto-token-generator.adapter';
import type { IUserRepository } from './domain/repositories/user.repository.interface';
import { AUTH_USER_REPOSITORY } from './domain/repositories/user.repository.interface';
import type { IAuthTokenService } from './application/ports/auth-token.port';
import { AUTH_TOKEN_SERVICE } from './application/ports/auth-token.port';
import type { IEmailSender } from './application/ports/email-sender.port';
import { AUTH_EMAIL_SENDER } from './application/ports/email-sender.port';
import type { IAvatarUrlProvider } from './application/ports/avatar-url.port';
import { AUTH_AVATAR_URL_PROVIDER } from './application/ports/avatar-url.port';
import type { IPasswordHasher } from './application/ports/password-hasher.port';
import { AUTH_PASSWORD_HASHER } from './application/ports/password-hasher.port';
import type { ITokenGenerator } from './application/ports/token-generator.port';
import { AUTH_TOKEN_GENERATOR } from './application/ports/token-generator.port';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { GetMeUseCase } from './application/use-cases/get-me.use-case';
import { RegisterUseCase } from './application/use-cases/register.use-case';
import { VerifyEmailUseCase } from './application/use-cases/verify-email.use-case';
import { UpdateProfileUseCase } from './application/use-cases/update-profile.use-case';
import { RequestPasswordResetUseCase } from './application/use-cases/request-password-reset.use-case';
import { ResetPasswordUseCase } from './application/use-cases/reset-password.use-case';
import { ChangePasswordUseCase } from './application/use-cases/change-password.use-case';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    PrismaModule,
    NotificationModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'dev-secret-change-in-prod',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    {
      provide: AUTH_USER_REPOSITORY,
      useClass: UserRepository,
    },
    {
      provide: AUTH_TOKEN_SERVICE,
      useClass: JwtAuthTokenService,
    },
    {
      provide: AUTH_EMAIL_SENDER,
      useClass: AuthEmailSenderAdapter,
    },
    {
      provide: AUTH_AVATAR_URL_PROVIDER,
      useClass: AvatarUrlAdapter,
    },
    {
      provide: AUTH_PASSWORD_HASHER,
      useClass: BcryptPasswordHasherAdapter,
    },
    {
      provide: AUTH_TOKEN_GENERATOR,
      useClass: CryptoTokenGeneratorAdapter,
    },
    JwtAuthGuard,
    AdminGuard,
    {
      provide: LoginUseCase,
      useFactory: (
        userRepo: IUserRepository,
        authTokenService: IAuthTokenService,
        passwordHasher: IPasswordHasher,
      ) => new LoginUseCase(userRepo, authTokenService, passwordHasher),
      inject: [AUTH_USER_REPOSITORY, AUTH_TOKEN_SERVICE, AUTH_PASSWORD_HASHER],
    },
    {
      provide: GetMeUseCase,
      useFactory: (userRepo: IUserRepository, avatarUrlProvider: IAvatarUrlProvider) =>
        new GetMeUseCase(userRepo, avatarUrlProvider),
      inject: [AUTH_USER_REPOSITORY, AUTH_AVATAR_URL_PROVIDER],
    },
    {
      provide: RegisterUseCase,
      useFactory: (
        userRepo: IUserRepository,
        emailSender: IEmailSender,
        passwordHasher: IPasswordHasher,
        tokenGenerator: ITokenGenerator,
      ) => new RegisterUseCase(userRepo, emailSender, passwordHasher, tokenGenerator),
      inject: [AUTH_USER_REPOSITORY, AUTH_EMAIL_SENDER, AUTH_PASSWORD_HASHER, AUTH_TOKEN_GENERATOR],
    },
    {
      provide: VerifyEmailUseCase,
      useFactory: (userRepo: IUserRepository) => new VerifyEmailUseCase(userRepo),
      inject: [AUTH_USER_REPOSITORY],
    },
    {
      provide: UpdateProfileUseCase,
      useFactory: (userRepo: IUserRepository, avatarUrlProvider: IAvatarUrlProvider) =>
        new UpdateProfileUseCase(userRepo, avatarUrlProvider),
      inject: [AUTH_USER_REPOSITORY, AUTH_AVATAR_URL_PROVIDER],
    },
    {
      provide: RequestPasswordResetUseCase,
      useFactory: (
        userRepo: IUserRepository,
        emailSender: IEmailSender,
        tokenGenerator: ITokenGenerator,
      ) => new RequestPasswordResetUseCase(userRepo, emailSender, tokenGenerator),
      inject: [AUTH_USER_REPOSITORY, AUTH_EMAIL_SENDER, AUTH_TOKEN_GENERATOR],
    },
    {
      provide: ResetPasswordUseCase,
      useFactory: (userRepo: IUserRepository, passwordHasher: IPasswordHasher) =>
        new ResetPasswordUseCase(userRepo, passwordHasher),
      inject: [AUTH_USER_REPOSITORY, AUTH_PASSWORD_HASHER],
    },
    {
      provide: ChangePasswordUseCase,
      useFactory: (userRepo: IUserRepository, passwordHasher: IPasswordHasher) =>
        new ChangePasswordUseCase(userRepo, passwordHasher),
      inject: [AUTH_USER_REPOSITORY, AUTH_PASSWORD_HASHER],
    },
    JwtStrategy,
  ],
  exports: [JwtModule, JwtAuthGuard, AdminGuard],
})
export class AuthModule {}
