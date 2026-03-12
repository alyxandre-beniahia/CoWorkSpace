import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaModule } from '../../prisma/prisma.module';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthModule } from '../auth.module'; // adjust the relative path if needed
import { LoginUseCase } from './login.use-case';

describe('LoginUseCase', () => {
  let useCase: LoginUseCase;
  let prisma: PrismaService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule, AuthModule],
    }).compile();

    useCase = module.get(LoginUseCase);
    prisma = module.get(PrismaService);
    jwtService = module.get(JwtService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('retourne un access_token si email et mot de passe valides (admin@test.com / password123 en base)', async () => {
    const result = await useCase.run({
      email: 'admin@test.com',
      password: 'password123',
    });

    expect(typeof result.access_token).toBe('string');
    expect(result.access_token.length).toBeGreaterThan(10);

    const decoded = jwtService.decode(result.access_token) as { sub: string; email: string; role: string } | null;
    expect(decoded).toBeTruthy();
    expect(decoded?.email).toBe('admin@test.com');
    expect(decoded?.role).toBe('admin');
  });

  it('lance UnauthorizedException si utilisateur inexistant', async () => {
    await expect(
      useCase.run({ email: 'inconnu@test.com', password: 'password123' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('lance UnauthorizedException si utilisateur inactif', async () => {
    const inactive = await prisma.user.create({
      data: {
        firstname: 'Inactive',
        lastname: 'User',
        email: `inactive-${Date.now()}@test.com`,
        password: (await prisma.user.findFirst({ where: { email: 'admin@test.com' } }))!.password,
        isActive: false,
        role: {
          connect: { slug: 'member' },
        },
      },
    });

    await expect(
      useCase.run({ email: inactive.email, password: 'password123' }),
    ).rejects.toThrow(UnauthorizedException);

    await prisma.user.delete({ where: { id: inactive.id } });
  });

  it('lance UnauthorizedException si mot de passe incorrect', async () => {
    await expect(
      useCase.run({ email: 'admin@test.com', password: 'wrong' }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
