import { Test, TestingModule } from '@nestjs/testing';
import { UserNotFoundError } from '../../domain/errors/auth.errors';
import type { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { AUTH_USER_REPOSITORY } from '../../domain/repositories/user.repository.interface';
import { AUTH_AVATAR_URL_PROVIDER } from '../ports/avatar-url.port';
import { UpdateProfileUseCase } from './update-profile.use-case';

describe('UpdateProfileUseCase', () => {
  let useCase: UpdateProfileUseCase;
  let mockUserRepo: jest.Mocked<IUserRepository>;
  const mockAvatarUrlProvider = { getAvatarUrl: jest.fn((id: string) => `https://api.dicebear.com/9.x/bottts/svg?seed=${id}`) };

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
        { provide: AUTH_AVATAR_URL_PROVIDER, useValue: mockAvatarUrlProvider },
        UpdateProfileUseCase,
      ],
    }).compile();

    useCase = module.get(UpdateProfileUseCase);
  });

  it('met à jour les champs du profil', async () => {
    const userId = 'user-1';
    mockUserRepo.findById.mockResolvedValue({
      id: userId,
      firstname: 'Profile',
      lastname: 'User',
      email: 'profile@test.com',
      phone: null,
      isActive: true,
      avatarUrl: null,
      emailVerifiedAt: null,
      roleId: 'role-1',
      role: { slug: 'member' },
    });
    mockUserRepo.updateProfile.mockResolvedValue({
      id: userId,
      firstname: 'NewFirst',
      lastname: 'NewLast',
      email: 'profile@test.com',
      phone: '0600000000',
      isActive: true,
      avatarUrl: null,
      emailVerifiedAt: null,
      roleId: 'role-1',
      role: { slug: 'member' },
    });

    const result = await useCase.run(userId, {
      firstname: 'NewFirst',
      lastname: 'NewLast',
      phone: '0600000000',
    });

    expect(result).toMatchObject({
      firstname: 'NewFirst',
      lastname: 'NewLast',
      phone: '0600000000',
    });
    expect(result).toHaveProperty('avatarUrl');
    expect(mockUserRepo.updateProfile).toHaveBeenCalledWith(userId, {
      firstname: 'NewFirst',
      lastname: 'NewLast',
      phone: '0600000000',
    });
  });

  it('lance UserNotFoundError si utilisateur introuvable', async () => {
    mockUserRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.run('unknown-id', { firstname: 'X', lastname: 'Y' }),
    ).rejects.toThrow(UserNotFoundError);
  });
});
