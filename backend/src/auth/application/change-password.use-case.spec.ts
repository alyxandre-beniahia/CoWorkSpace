import * as bcrypt from 'bcrypt';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaModule } from '../../prisma/prisma.module';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthModule } from '../auth.module';
import { ChangePasswordUseCase } from './change-password.use-case';

describe('ChangePasswordUseCase', () => {
  let useCase: ChangePasswordUseCase;
  let prisma: PrismaService;
  let userId: string;
  const plainPassword = 'oldPassword123';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule, AuthModule],
    }).compile();

    useCase = module.get(ChangePasswordUseCase);
    prisma = module.get(PrismaService);

    const memberRole = await prisma.role.findUnique({ where: { slug: 'member' } });
    if (!memberRole) throw new Error('Rôle member manquant pour les tests');

    const passwordHash = await bcrypt.hash(plainPassword, 10);
    const user = await prisma.user.create({
      data: {
        firstname: 'Change',
        lastname: 'Password',
        email: `change-pwd-${Date.now()}@test.com`,
        password: passwordHash,
        isActive: true,
        roleId: memberRole.id,
      },
    });
    userId = user.id;
  });

  afterEach(async () => {
    await prisma.user.deleteMany({
      where: { email: { startsWith: 'change-pwd-' } },
    });
  });

  it('change le mot de passe avec succès', async () => {
    const result = await useCase.run(userId, {
      currentPassword: plainPassword,
      newPassword: 'newPassword456',
      confirmPassword: 'newPassword456',
    });

    expect(result).toEqual({ message: 'Mot de passe mis à jour' });

    const updated = await prisma.user.findUnique({ where: { id: userId } });
    expect(updated).toBeDefined();
    const isValid = await bcrypt.compare('newPassword456', updated!.password);
    expect(isValid).toBe(true);
  });

  it('lance BadRequestException si confirmation différente', async () => {
    await expect(
      useCase.run(userId, {
        currentPassword: plainPassword,
        newPassword: 'newPassword456',
        confirmPassword: 'differentConfirm',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('lance UnauthorizedException si mot de passe actuel incorrect', async () => {
    await expect(
      useCase.run(userId, {
        currentPassword: 'wrongPassword',
        newPassword: 'newPassword456',
        confirmPassword: 'newPassword456',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
