import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { InvalidCredentialsError } from '../../domain/errors/auth.errors';
import type { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { AUTH_USER_REPOSITORY } from '../../domain/repositories/user.repository.interface';
import type { IAuthTokenService } from '../ports/auth-token.port';
import { AUTH_TOKEN_SERVICE } from '../ports/auth-token.port';
import { LoginUseCase } from './login.use-case';

describe('LoginUseCase', () => {
  let useCase: LoginUseCase;
  let mockUserRepo: jest.Mocked<IUserRepository>;
  let mockAuthTokenService: jest.Mocked<IAuthTokenService>;

  const validPasswordHash = bcrypt.hashSync('password123', 10);

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
    mockAuthTokenService = {
      sign: jest.fn().mockReturnValue('mock-access-token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        { provide: AUTH_USER_REPOSITORY, useValue: mockUserRepo },
        { provide: AUTH_TOKEN_SERVICE, useValue: mockAuthTokenService },
        LoginUseCase,
      ],
    }).compile();

    useCase = module.get(LoginUseCase);
  });

  it('retourne un access_token si email et mot de passe valides', async () => {
    mockUserRepo.findByEmailForLogin.mockResolvedValue({
      id: 'user-1',
      email: 'admin@test.com',
      passwordHash: validPasswordHash,
      isActive: true,
      role: { slug: 'admin' },
    });

    const result = await useCase.run({
      email: 'admin@test.com',
      password: 'password123',
    });

    expect(result.access_token).toBe('mock-access-token');
    expect(mockAuthTokenService.sign).toHaveBeenCalledWith({
      sub: 'user-1',
      email: 'admin@test.com',
      role: 'admin',
    });
  });

  it('lance InvalidCredentialsError si utilisateur inexistant', async () => {
    mockUserRepo.findByEmailForLogin.mockResolvedValue(null);

    await expect(
      useCase.run({ email: 'inconnu@test.com', password: 'password123' }),
    ).rejects.toThrow(InvalidCredentialsError);
  });

  it('lance InvalidCredentialsError si utilisateur inactif', async () => {
    mockUserRepo.findByEmailForLogin.mockResolvedValue({
      id: 'user-1',
      email: 'inactive@test.com',
      passwordHash: validPasswordHash,
      isActive: false,
      role: { slug: 'member' },
    });

    await expect(
      useCase.run({ email: 'inactive@test.com', password: 'password123' }),
    ).rejects.toThrow(InvalidCredentialsError);
  });

  it('lance InvalidCredentialsError si mot de passe incorrect', async () => {
    mockUserRepo.findByEmailForLogin.mockResolvedValue({
      id: 'user-1',
      email: 'admin@test.com',
      passwordHash: validPasswordHash,
      isActive: true,
      role: { slug: 'admin' },
    });

    await expect(
      useCase.run({ email: 'admin@test.com', password: 'wrong' }),
    ).rejects.toThrow(InvalidCredentialsError);
  });
});
