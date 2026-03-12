import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaModule } from '../../prisma/prisma.module';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthModule } from '../auth.module';
import { VerifyEmailUseCase } from './verify-email.use-case';

describe('VerifyEmailUseCase', () => {
  let useCase: VerifyEmailUseCase;
  let prisma: PrismaService;
  let token: string;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule, AuthModule],
    }).compile();

    useCase = module.get(VerifyEmailUseCase);
    prisma = module.get(PrismaService);

    const memberRole = await prisma.role.findUnique({ where: { slug: 'member' } });
    if (!memberRole) throw new Error('Rôle member manquant pour les tests');

    const user = await prisma.user.create({
      data: {
        firstname: 'Verify',
        lastname: 'User',
        email: `verify-${Date.now()}@test.com`,
        password: 'hash',
        isActive: false,
        roleId: memberRole.id,
      },
    });

    token = `token-${Date.now()}`;
    await prisma.userToken.create({
      data: {
        type: 'EMAIL_VERIFICATION',
        token,
        userId: user.id,
      },
    });
  });

  afterEach(async () => {
    await prisma.userToken.deleteMany({
      where: { token: { startsWith: 'token-' } },
    });
    await prisma.user.deleteMany({
      where: { email: { startsWith: 'verify-' } },
    });
  });

  it('marque l\'email comme vérifié et invalide le token (compte reste inactif)', async () => {
    const result = await useCase.run(token);
    expect(result.message).toContain('Email vérifié');

    const userToken = await prisma.userToken.findFirst({ where: { token } });
    expect(userToken?.deletedAt).not.toBeNull();

    const user = await prisma.user.findFirst({ where: { email: { startsWith: 'verify-' } } });
    expect(user?.emailVerifiedAt).not.toBeNull();
    expect(user?.isActive).toBe(false);
  });

  it('lance NotFoundException si token invalide', async () => {
    await expect(useCase.run('unknown-token')).rejects.toThrow(NotFoundException);
  });

  it('retourne un message de succès si le token a déjà été utilisé (compte déjà vérifié)', async () => {
    const first = await useCase.run(token);
    expect(first.message).toContain('Email vérifié');

    const second = await useCase.run(token);
    expect(second.message).toMatch(/déjà vérifié|vérifié/);
  });

  it('lance BadRequestException si token manquant ou vide', async () => {
    await expect(useCase.run('')).rejects.toThrow(BadRequestException);
  });

  it('accepte un token avec espaces (trim)', async () => {
    const result = await useCase.run(`  ${token}  `);
    expect(result.message).toContain('Email vérifié');
  });
});

