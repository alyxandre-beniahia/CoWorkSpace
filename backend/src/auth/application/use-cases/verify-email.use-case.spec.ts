import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestAuthError,
  InvalidOrExpiredTokenError,
} from '../../domain/errors/auth.errors';
import type { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { AUTH_USER_REPOSITORY } from '../../domain/repositories/user.repository.interface';
import { VerifyEmailUseCase } from './verify-email.use-case';

describe('VerifyEmailUseCase', () => {
  let useCase: VerifyEmailUseCase;
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
        VerifyEmailUseCase,
      ],
    }).compile();

    useCase = module.get(VerifyEmailUseCase);
  });

  it("marque l'email comme vérifié et invalide le token (compte reste inactif)", async () => {
    const token = 'valid-token';
    mockUserRepo.findAndConsumeEmailVerificationToken.mockResolvedValue({
      userId: 'user-1',
    });

    const result = await useCase.run(token);

    expect(result.message).toContain('Email vérifié');
    expect(mockUserRepo.findAndConsumeEmailVerificationToken).toHaveBeenCalledWith(
      token,
    );
  });

  it('lance InvalidOrExpiredTokenError si token invalide', async () => {
    mockUserRepo.findAndConsumeEmailVerificationToken.mockResolvedValue(null);

    await expect(useCase.run('unknown-token')).rejects.toThrow(
      InvalidOrExpiredTokenError,
    );
  });

  it('retourne un message de succès si le token a déjà été utilisé (compte déjà vérifié)', async () => {
    const token = 'already-used-token';
    mockUserRepo.findAndConsumeEmailVerificationToken.mockResolvedValue({
      alreadyVerified: true,
    });

    const result = await useCase.run(token);

    expect(result.message).toMatch(/déjà vérifié|vérifié/);
  });

  it('lance BadRequestAuthError si token manquant ou vide', async () => {
    await expect(useCase.run('')).rejects.toThrow(BadRequestAuthError);
  });

  it('accepte un token avec espaces (trim non requis par le use case, mock accepte la valeur reçue)', async () => {
    const tokenWithSpaces = '  valid-token  ';
    mockUserRepo.findAndConsumeEmailVerificationToken.mockResolvedValue({
      userId: 'user-1',
    });

    const result = await useCase.run(tokenWithSpaces);

    expect(result.message).toContain('Email vérifié');
    expect(mockUserRepo.findAndConsumeEmailVerificationToken).toHaveBeenCalledWith(
      tokenWithSpaces,
    );
  });
});
