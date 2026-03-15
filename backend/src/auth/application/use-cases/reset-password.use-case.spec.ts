import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestAuthError,
  InvalidOrExpiredTokenError,
} from '../../domain/errors/auth.errors';
import type { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { AUTH_USER_REPOSITORY } from '../../domain/repositories/user.repository.interface';
import { ResetPasswordUseCase } from './reset-password.use-case';

describe('ResetPasswordUseCase', () => {
  let useCase: ResetPasswordUseCase;
  let mockUserRepo: jest.Mocked<IUserRepository>;

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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        { provide: AUTH_USER_REPOSITORY, useValue: mockUserRepo },
        ResetPasswordUseCase,
      ],
    }).compile();

    useCase = module.get(ResetPasswordUseCase);
  });

  it('met à jour le mot de passe et invalide le token', async () => {
    const token = 'valid-reset-token';
    mockUserRepo.findAndConsumePasswordResetToken.mockResolvedValue(true);

    const result = await useCase.run({ token, password: 'newpass123' });

    expect(result.message).toContain('Mot de passe mis à jour');
    expect(mockUserRepo.findAndConsumePasswordResetToken).toHaveBeenCalledWith(
      token,
      expect.any(String),
    );
  });

  it('lance InvalidOrExpiredTokenError si token invalide', async () => {
    mockUserRepo.findAndConsumePasswordResetToken.mockResolvedValue(false);

    await expect(
      useCase.run({ token: 'unknown-token', password: 'x' }),
    ).rejects.toThrow(InvalidOrExpiredTokenError);
  });

  it('lance BadRequestAuthError si token manquant', async () => {
    await expect(
      useCase.run({ token: '', password: 'x' }),
    ).rejects.toThrow(BadRequestAuthError);
  });
});
