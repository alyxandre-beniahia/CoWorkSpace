import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaModule } from '../../prisma/prisma.module';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthModule } from '../auth.module';
import { ResetPasswordUseCase } from './reset-password.use-case';
import * as bcrypt from 'bcrypt';

describe('ResetPasswordUseCase', () => {
  let useCase: ResetPasswordUseCase;
  let prisma: PrismaService;
  let token: string;
  let email: string;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule, AuthModule],
    }).compile();

    useCase = module.get(ResetPasswordUseCase);
    prisma = module.get(PrismaService);

    const memberRole = await prisma.role.findUnique({ where: { slug: 'member' } });
    if (!memberRole) throw new Error('Rôle member manquant pour les tests');

    email = `resetpass-${Date.now()}@test.com`;
    const user = await prisma.user.create({
      data: {
        firstname: 'ResetPass',
        lastname: 'User',
        email,
        password: await bcrypt.hash('oldpass', 10),
        isActive: true,
        roleId: memberRole.id,
      },
    });

    token = `reset-token-${Date.now()}`;
    await prisma.userToken.create({
      data: {
        type: 'PASSWORD_RESET',
        token,
        userId: user.id,
      },
    });
  });

  afterEach(async () => {
    await prisma.userToken.deleteMany({
      where: { token: { startsWith: 'reset-token-' } },
    });
    await prisma.user.deleteMany({
      where: { email: { startsWith: 'resetpass-' } },
    });
  });

  it('met à jour le mot de passe et invalide le token', async () => {
    const result = await useCase.run({ token, password: 'newpass123' });
    expect(result.message).toContain('Mot de passe mis à jour');

    const user = await prisma.user.findUnique({ where: { email } });
    expect(user).toBeTruthy();
    const isMatch = await bcrypt.compare('newpass123', user!.password);
    expect(isMatch).toBe(true);
  });

  it('lance NotFoundException si token invalide', async () => {
    await expect(
      useCase.run({ token: 'unknown-token', password: 'x' }),
    ).rejects.toThrow(NotFoundException);
  });
});

