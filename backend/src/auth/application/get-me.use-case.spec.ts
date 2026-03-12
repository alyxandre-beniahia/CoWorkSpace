import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { GetMeUseCase } from './get-me.use-case';

describe('GetMeUseCase', () => {
  let useCase: GetMeUseCase;
  let prisma: jest.Mocked<Pick<PrismaService, 'user'>>;

  const mockUser = {
    id: 'user-1',
    email: 'admin@test.com',
    firstname: 'Admin',
    lastname: 'Test',
    role: { slug: 'admin' },
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
      },
    } as unknown as jest.Mocked<Pick<PrismaService, 'user'>>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetMeUseCase,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    useCase = module.get(GetMeUseCase);
  });

  it('retourne l’utilisateur courant (id, email, firstname, lastname, role.slug)', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

    const result = await useCase.run('user-1');

    expect(result).toEqual({
      id: 'user-1',
      email: 'admin@test.com',
      firstname: 'Admin',
      lastname: 'Test',
      role: { slug: 'admin' },
    });
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      select: {
        id: true,
        email: true,
        firstname: true,
        lastname: true,
        role: { select: { slug: true } },
      },
    });
  });

  it('lance NotFoundException si utilisateur non trouvé', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(useCase.run('unknown-id')).rejects.toThrow(NotFoundException);
  });
});
