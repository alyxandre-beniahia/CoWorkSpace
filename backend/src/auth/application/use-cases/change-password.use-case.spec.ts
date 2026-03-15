import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestAuthError,
  InvalidCredentialsError,
  UserNotFoundError,
} from '../../domain/errors/auth.errors';
import type { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { AUTH_USER_REPOSITORY } from '../../domain/repositories/user.repository.interface';
import type { IPasswordHasher } from '../ports/password-hasher.port';
import { AUTH_PASSWORD_HASHER } from '../ports/password-hasher.port';
import { ChangePasswordUseCase } from './change-password.use-case';

describe('ChangePasswordUseCase', () => {
  let useCase: ChangePasswordUseCase;
  let mockUserRepo: jest.Mocked<IUserRepository>;
  let mockPasswordHasher: jest.Mocked<IPasswordHasher>;
  const plainPassword = 'oldPassword123';

  beforeEach(async () => {
    mockUserRepo = {
      findById: jest.fn(),
      findByIdWithPassword: jest.fn().mockResolvedValue({ passwordHash: 'stored-hash' }),
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
    mockPasswordHasher = {
      hash: jest.fn().mockResolvedValue('new-password-hash'),
      compare: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        { provide: AUTH_USER_REPOSITORY, useValue: mockUserRepo },
        { provide: AUTH_PASSWORD_HASHER, useValue: mockPasswordHasher },
        {
          provide: ChangePasswordUseCase,
          useFactory: (userRepo: IUserRepository, passwordHasher: IPasswordHasher) =>
            new ChangePasswordUseCase(userRepo, passwordHasher),
          inject: [AUTH_USER_REPOSITORY, AUTH_PASSWORD_HASHER],
        },
      ],
    }).compile();

    useCase = module.get(ChangePasswordUseCase);
  });

  it('change le mot de passe avec succès', async () => {
    const userId = 'user-1';
    mockUserRepo.updatePassword.mockResolvedValue(undefined);
    mockPasswordHasher.compare.mockResolvedValue(true);
    mockPasswordHasher.hash.mockResolvedValue('new-password-hash');

    const result = await useCase.run(userId, {
      currentPassword: plainPassword,
      newPassword: 'newPassword456',
      confirmPassword: 'newPassword456',
    });

    expect(result).toEqual({ message: 'Mot de passe mis à jour' });
    expect(mockUserRepo.findByIdWithPassword).toHaveBeenCalledWith(userId);
    expect(mockPasswordHasher.compare).toHaveBeenCalledWith(plainPassword, 'stored-hash');
    expect(mockPasswordHasher.hash).toHaveBeenCalledWith('newPassword456');
    expect(mockUserRepo.updatePassword).toHaveBeenCalledWith(userId, 'new-password-hash');
  });

  it('lance BadRequestAuthError si confirmation différente', async () => {
    await expect(
      useCase.run('user-1', {
        currentPassword: plainPassword,
        newPassword: 'newPassword456',
        confirmPassword: 'differentConfirm',
      }),
    ).rejects.toThrow(BadRequestAuthError);

    expect(mockUserRepo.updatePassword).not.toHaveBeenCalled();
  });

  it('lance InvalidCredentialsError si mot de passe actuel incorrect', async () => {
    mockPasswordHasher.compare.mockResolvedValue(false);

    await expect(
      useCase.run('user-1', {
        currentPassword: 'wrongPassword',
        newPassword: 'newPassword456',
        confirmPassword: 'newPassword456',
      }),
    ).rejects.toThrow(InvalidCredentialsError);

    expect(mockUserRepo.updatePassword).not.toHaveBeenCalled();
  });

  it('lance UserNotFoundError si utilisateur non trouvé', async () => {
    mockUserRepo.findByIdWithPassword.mockResolvedValue(null);

    await expect(
      useCase.run('unknown-id', {
        currentPassword: plainPassword,
        newPassword: 'newPassword456',
        confirmPassword: 'newPassword456',
      }),
    ).rejects.toThrow(UserNotFoundError);
  });
});
