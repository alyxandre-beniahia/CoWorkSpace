import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaModule } from '../../prisma/prisma.module';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthModule } from '../auth.module';
import { GetMeUseCase } from './get-me.use-case';

describe('GetMeUseCase', () => {
  let useCase: GetMeUseCase;
  let prisma: PrismaService;
  let adminId: string;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule, AuthModule],
    }).compile();

    useCase = module.get(GetMeUseCase);
    prisma = module.get(PrismaService);

    const admin = await prisma.user.findUnique({
      where: { email: 'admin@test.com' },
      select: { id: true },
    });
    if (!admin) {
      throw new Error('Utilisateur admin@test.com manquant en base. Lance prisma/seed avant les tests.');
    }
    adminId = admin.id;
  });

  it('retourne l’utilisateur courant (id, email, firstname, lastname, role.slug)', async () => {
    const result = await useCase.run(adminId);

    expect(result).toMatchObject({
      id: adminId,
      email: 'admin@test.com',
      firstname: expect.any(String),
      lastname: expect.any(String),
      role: { slug: 'admin' },
    });
  });

  it('lance NotFoundException si utilisateur non trouvé', async () => {
    await expect(useCase.run('unknown-id')).rejects.toThrow(NotFoundException);
  });
});
