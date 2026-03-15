import { Test, TestingModule } from '@nestjs/testing';
import { EmailAlreadyExistsError, RoleMissingError } from '../../domain/errors/auth.errors';
import type { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { AUTH_USER_REPOSITORY } from '../../domain/repositories/user.repository.interface';
import type { IEmailSender } from '../ports/email-sender.port';
import { AUTH_EMAIL_SENDER } from '../ports/email-sender.port';
import { RegisterUseCase } from './register.use-case';

describe('RegisterUseCase', () => {
  let useCase: RegisterUseCase;
  let mockUserRepo: jest.Mocked<IUserRepository>;
  let mockEmailSender: jest.Mocked<IEmailSender>;

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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        { provide: AUTH_USER_REPOSITORY, useValue: mockUserRepo },
        { provide: AUTH_EMAIL_SENDER, useValue: mockEmailSender },
        RegisterUseCase,
      ],
    }).compile();

    useCase = module.get(RegisterUseCase);
  });

  it("crée un utilisateur inactif avec un token de vérification d'email", async () => {
    const email = 'new-user@test.com';
    mockUserRepo.findByEmail.mockResolvedValue(null);
    mockUserRepo.findRoleIdBySlug.mockResolvedValue('role-member-id');
    mockUserRepo.createUser.mockResolvedValue({
      id: 'user-1',
      firstname: 'New',
      lastname: 'User',
      email,
      phone: null,
      isActive: false,
      avatarUrl: null,
      emailVerifiedAt: null,
      roleId: 'role-member-id',
    });
    mockUserRepo.createToken.mockResolvedValue(undefined);

    const result = await useCase.run({
      firstname: 'New',
      lastname: 'User',
      email,
      password: 'password123',
    });

    expect(result.message).toContain('Inscription enregistrée');
    expect(mockUserRepo.findByEmail).toHaveBeenCalledWith(email);
    expect(mockUserRepo.findRoleIdBySlug).toHaveBeenCalledWith('member');
    expect(mockUserRepo.createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        firstname: 'New',
        lastname: 'User',
        email,
        roleId: 'role-member-id',
        isActive: false,
      }),
    );
    expect(mockUserRepo.createToken).toHaveBeenCalledWith(
      'EMAIL_VERIFICATION',
      'user-1',
      expect.any(String),
    );
    expect(mockEmailSender.sendVerificationEmail).toHaveBeenCalledTimes(1);
    expect(mockEmailSender.sendVerificationEmail).toHaveBeenCalledWith(
      email,
      expect.any(String),
    );
  });

  it("lance EmailAlreadyExistsError si l'email existe déjà", async () => {
    const email = 'existing@test.com';
    mockUserRepo.findByEmail.mockResolvedValue({ id: 'existing-user-id' });

    await expect(
      useCase.run({
        firstname: 'New',
        lastname: 'User',
        email,
        password: 'password123',
      }),
    ).rejects.toThrow(EmailAlreadyExistsError);

    expect(mockUserRepo.createUser).not.toHaveBeenCalled();
  });

  it('lance RoleMissingError si rôle member manquant', async () => {
    mockUserRepo.findByEmail.mockResolvedValue(null);
    mockUserRepo.findRoleIdBySlug.mockResolvedValue(null);

    await expect(
      useCase.run({
        firstname: 'New',
        lastname: 'User',
        email: 'new@test.com',
        password: 'password123',
      }),
    ).rejects.toThrow(RoleMissingError);
  });
});
