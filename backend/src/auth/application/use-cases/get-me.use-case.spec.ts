import { Test, TestingModule } from '@nestjs/testing';
import { UserNotFoundError } from '../../domain/errors/auth.errors';
import type { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { AUTH_USER_REPOSITORY } from '../../domain/repositories/user.repository.interface';
import { AUTH_AVATAR_URL_PROVIDER } from '../ports/avatar-url.port';
import { GetMeUseCase } from './get-me.use-case';

describe('GetMeUseCase', () => {
  let useCase: GetMeUseCase;
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
        GetMeUseCase,
      ],
    }).compile();

    useCase = module.get(GetMeUseCase);
  });

  it('retourne l’utilisateur courant (id, email, firstname, lastname, role.slug)', async () => {
    const adminId = 'admin-1';
    mockUserRepo.findById.mockResolvedValue({
      id: adminId,
      firstname: 'Admin',
      lastname: 'User',
      email: 'admin@test.com',
      phone: null,
      isActive: true,
      avatarUrl: null,
      emailVerifiedAt: new Date(),
      roleId: 'role-1',
      role: { slug: 'admin' },
    });

    const result = await useCase.run(adminId);

    expect(result).toMatchObject({
      id: adminId,
      email: 'admin@test.com',
      firstname: 'Admin',
      lastname: 'User',
      role: { slug: 'admin' },
    });
    expect(result).toHaveProperty('phone');
    expect(result).toHaveProperty('avatarUrl');
    expect(result.avatarUrl).toMatch(/^https:\/\/api\.dicebear\.com\/9\.x\/.+\/svg\?seed=/);
  });

  it('lance UserNotFoundError si utilisateur non trouvé', async () => {
    mockUserRepo.findById.mockResolvedValue(null);

    await expect(useCase.run('unknown-id')).rejects.toThrow(UserNotFoundError);
  });

  it('lance UserNotFoundError si role manquant', async () => {
    mockUserRepo.findById.mockResolvedValue({
      id: 'user-1',
      firstname: 'A',
      lastname: 'B',
      email: 'a@b.com',
      phone: null,
      isActive: true,
      avatarUrl: null,
      emailVerifiedAt: null,
      roleId: 'role-1',
      role: null as unknown as { slug: string },
    });

    await expect(useCase.run('user-1')).rejects.toThrow(UserNotFoundError);
  });
});
