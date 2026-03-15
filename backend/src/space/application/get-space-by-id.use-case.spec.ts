import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaModule } from '../../database/prisma.module';
import { PrismaService } from '../../database/prisma.service';
import { SpaceModule } from '../space.module';
import { GetSpaceByIdUseCase } from './get-space-by-id.use-case';

describe('GetSpaceByIdUseCase', () => {
  let useCase: GetSpaceByIdUseCase;
  let prisma: PrismaService;
  let spaceId: string;
  let equipementId: string;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule, SpaceModule],
    }).compile();

    useCase = module.get(GetSpaceByIdUseCase);
    prisma = module.get(PrismaService);

    const equipement = await prisma.equipement.create({
      data: { name: `Écran test ${Date.now()}` },
    });
    equipementId = equipement.id;

    const space = await prisma.space.create({
      data: {
        name: `Salle B test ${Date.now()}`,
        code: `B-${Math.floor(Math.random() * 1000)}`,
        type: 'MEETING_ROOM',
        capacity: 10,
        status: 'AVAILABLE',
        description: 'Salle de test pour GetSpaceByIdUseCase',
        positionX: 10,
        positionY: 20,
        spaceEquipements: {
          create: {
            equipementId: equipement.id,
          },
        },
      },
    });
    spaceId = space.id;
  });

  afterEach(async () => {
    await prisma.spaceEquipement.deleteMany({ where: { spaceId } });
    await prisma.space.delete({ where: { id: spaceId } });
    await prisma.equipement.delete({ where: { id: equipementId } });
  });

  it('retourne l’espace avec équipements si trouvé', async () => {
    const result = await useCase.run(spaceId);

    expect(result).toMatchObject({
      id: spaceId,
      name: expect.stringContaining('Salle B test'),
      type: 'MEETING_ROOM',
      capacity: 10,
      status: 'AVAILABLE',
      positionX: 10,
      positionY: 20,
    });
    expect(result.equipements.length).toBeGreaterThanOrEqual(1);
  });

  it('lance NotFoundException si l’espace n’existe pas', async () => {
    await expect(useCase.run('unknown-id')).rejects.toThrow(NotFoundException);
  });
});
