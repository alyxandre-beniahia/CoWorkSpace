import * as bcrypt from 'bcrypt';
import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestAuthError,
  InvalidCredentialsError,
  UserNotFoundError,
} from '../../domain/errors/auth.errors';
import type { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { AUTH_USER_REPOSITORY } from '../../domain/repositories/user.repository.interface';
import { ChangePasswordUseCase } from './change-password.use-case';

describe('ChangePasswordUseCase', () => {
  let useCase: ChangePasswordUseCase;
  let mockUserRepo: jest.Mocked<IUserRepository>;
  const plainPassword = 'oldPassword123';

  beforeEach(async () => {
    const passwordHash = bcrypt.hashSync(plainPassword, 10);
    mockUserRepo = {
      findById: jest.fn(),
      findByIdWithPassword: jest.fn().mockResolvedValue({ passwordHash }),
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
        ChangePasswordUseCase,
      ],
    }).compile();

    useCase = module.get(ChangePasswordUseCase);
  });

  it('change le mot de passe avec succès', async () => {
    const userId = 'user-1';
    mockUserRepo.updatePassword.mockResolvedValue(undefined);

    const result = await useCase.run(userId, {
      currentPassword: plainPassword,
      newPassword: 'newPassword456',
      confirmPassword: 'newPassword456',
    });

    expect(result).toEqual({ message: 'Mot de passe mis à jour' });
    expect(mockUserRepo.findByIdWithPassword).toHaveBeenCalledWith(userId);
    expect(mockUserRepo.updatePassword).toHaveBeenCalledWith(
      userId,
      expect.any(String),
    );
    const hashArg = mockUserRepo.updatePassword.mock.calls[0][1];
    const isValid = await bcrypt.compare('newPassword456', hashArg);
    expect(isValid).toBe(true);
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
