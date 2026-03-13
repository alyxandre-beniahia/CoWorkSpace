import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaModule } from '../../prisma/prisma.module';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthModule } from '../auth.module';
import { UpdateProfileUseCase } from './update-profile.use-case';

describe('UpdateProfileUseCase', () => {
  let useCase: UpdateProfileUseCase;
  let prisma: PrismaService;
  let userId: string;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule, AuthModule],
    }).compile();

    useCase = module.get(UpdateProfileUseCase);
    prisma = module.get(PrismaService);

    const memberRole = await prisma.role.findUnique({ where: { slug: 'member' } });
    if (!memberRole) throw new Error('Rôle member manquant pour les tests');

    const user = await prisma.user.create({
      data: {
        firstname: 'Profile',
        lastname: 'User',
        email: `profile-${Date.now()}@test.com`,
        password: 'hash',
        isActive: true,
        roleId: memberRole.id,
      },
    });
    userId = user.id;
  });

  afterEach(async () => {
    await prisma.user.deleteMany({
      where: { email: { startsWith: 'profile-' } },
    });
  });

  it('met à jour les champs du profil', async () => {
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
  });

  it('lance NotFoundException si utilisateur introuvable', async () => {
    await expect(
      useCase.run('unknown-id', { firstname: 'X', lastname: 'Y' }),
    ).rejects.toThrow(NotFoundException);
  });
});

