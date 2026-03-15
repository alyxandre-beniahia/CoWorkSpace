import { Test, TestingModule } from '@nestjs/testing';
import type { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { AUTH_USER_REPOSITORY } from '../../domain/repositories/user.repository.interface';
import type { IEmailSender } from '../ports/email-sender.port';
import { AUTH_EMAIL_SENDER } from '../ports/email-sender.port';
import type { ITokenGenerator } from '../ports/token-generator.port';
import { AUTH_TOKEN_GENERATOR } from '../ports/token-generator.port';
import { RequestPasswordResetUseCase } from './request-password-reset.use-case';

describe('RequestPasswordResetUseCase', () => {
  let useCase: RequestPasswordResetUseCase;
  let mockUserRepo: jest.Mocked<IUserRepository>;
  let mockEmailSender: jest.Mocked<IEmailSender>;
  let mockTokenGenerator: jest.Mocked<ITokenGenerator>;

  beforeEach(async () => {
    mockUserRepo = {
      findById: jest.fn(),
      findByIdWithPassword: jest.fn(),
      findByEmailForLogin: jest.fn(),
      findByEmail: jest.fn(),
      findRoleIdBySlug: jest.fn(),
      createUser: jest.fn(),
      updateProfile: jest.fn(),
      updatePassword: jest.fn(),
      createToken: jest.fn(),
      findAndConsumeEmailVerificationToken: jest.fn(),
      findAndConsumePasswordResetToken: jest.fn(),
    };
    mockEmailSender = {
      sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
      sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
    };
    mockTokenGenerator = {
      generate: jest.fn().mockReturnValue('reset-token-hex'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        { provide: AUTH_USER_REPOSITORY, useValue: mockUserRepo },
        { provide: AUTH_EMAIL_SENDER, useValue: mockEmailSender },
        { provide: AUTH_TOKEN_GENERATOR, useValue: mockTokenGenerator },
        {
          provide: RequestPasswordResetUseCase,
          useFactory: (
            userRepo: IUserRepository,
            emailSender: IEmailSender,
            tokenGenerator: ITokenGenerator,
          ) => new RequestPasswordResetUseCase(userRepo, emailSender, tokenGenerator),
          inject: [AUTH_USER_REPOSITORY, AUTH_EMAIL_SENDER, AUTH_TOKEN_GENERATOR],
        },
      ],
    }).compile();

    useCase = module.get(RequestPasswordResetUseCase);
  });

  it('crée un token de reset pour un utilisateur existant et renvoie un message générique', async () => {
    const existingEmail = 'reset@test.com';
    mockUserRepo.findByEmail.mockResolvedValue({ id: 'user-1' });
    mockUserRepo.createToken.mockResolvedValue(undefined);

    const result = await useCase.run({ email: existingEmail });

    expect(result.message).toContain('un lien de réinitialisation');
    expect(mockUserRepo.findByEmail).toHaveBeenCalledWith(existingEmail);
    expect(mockUserRepo.createToken).toHaveBeenCalledWith(
      'PASSWORD_RESET',
      'user-1',
      expect.any(String),
    );
    expect(mockEmailSender.sendPasswordResetEmail).toHaveBeenCalledTimes(1);
    expect(mockEmailSender.sendPasswordResetEmail).toHaveBeenCalledWith(
      existingEmail,
      expect.any(String),
    );
  });

  it("renvoie un message générique même si l'utilisateur n'existe pas", async () => {
    mockUserRepo.findByEmail.mockResolvedValue(null);

    const result = await useCase.run({ email: 'unknown@test.com' });

    expect(result.message).toContain('un lien de réinitialisation');
    expect(mockUserRepo.createToken).not.toHaveBeenCalled();
    expect(mockEmailSender.sendPasswordResetEmail).not.toHaveBeenCalled();
  });
});
