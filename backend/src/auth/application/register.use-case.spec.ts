import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaModule } from '../../prisma/prisma.module';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthModule } from '../auth.module';
import { RegisterUseCase } from './register.use-case';

describe('RegisterUseCase', () => {
  let useCase: RegisterUseCase;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule, AuthModule],
    }).compile();

    useCase = module.get(RegisterUseCase);
    prisma = module.get(PrismaService);
  });

  afterEach(async () => {
    await prisma.userToken.deleteMany({
      where: { user: { email: { startsWith: 'new-user-' } } },
    });
    await prisma.user.deleteMany({
      where: { email: { startsWith: 'new-user-' } },
    });
  });

  it("crée un utilisateur inactif avec un token de vérification d'email", async () => {
    const email = `new-user-${Date.now()}@test.com`;
    const result = await useCase.run({
      firstname: 'New',
      lastname: 'User',
      email,
      password: 'password123',
    });

    expect(result.message).toContain('Inscription enregistrée');

    const user = await prisma.user.findUnique({
      where: { email },
      include: { userTokens: true },
    });
    expect(user).toBeTruthy();
    expect(user?.isActive).toBe(false);
    expect(user?.userTokens.some((t) => t.type === 'EMAIL_VERIFICATION')).toBe(true);
  });

  it("lance une BadRequestException si l'email existe déjà", async () => {
    const email = `new-user-${Date.now()}@test.com`;
    await useCase.run({
      firstname: 'New',
      lastname: 'User',
      email,
      password: 'password123',
    });

    await expect(
      useCase.run({
        firstname: 'New2',
        lastname: 'User2',
        email,
        password: 'password123',
      }),
    ).rejects.toThrow(BadRequestException);
  });
});

