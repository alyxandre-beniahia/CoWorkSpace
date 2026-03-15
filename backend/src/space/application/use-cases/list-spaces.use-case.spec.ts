import { Test, TestingModule } from '@nestjs/testing';
import { PrismaModule } from '../../../database/prisma.module';
import { PrismaService } from '../../../database/prisma.service';
import { SpaceModule } from '../../space.module';
import { ListSpacesUseCase } from './list-spaces.use-case';

describe('ListSpacesUseCase', () => {
  let useCase: ListSpacesUseCase;
  let prisma: PrismaService;
  let spaceId: string;
  let equipementId: string;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule, SpaceModule],
    }).compile();

    useCase = module.get(ListSpacesUseCase);
    prisma = module.get(PrismaService);

    const equipement = await prisma.equipement.create({
      data: { name: `Vidéoprojecteur test ${Date.now()}` },
    });
    equipementId = equipement.id;

    const space = await prisma.space.create({
      data: {
        name: `Salle A test ${Date.now()}`,
        code: `A-${Math.floor(Math.random() * 1000)}`,
        type: 'MEETING_ROOM',
        capacity: 8,
        status: 'AVAILABLE',
        description: 'Salle de test pour ListSpacesUseCase',
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

  it('retourne la liste des espaces du repository', async () => {
    const result = await useCase.run({});

    expect(Array.isArray(result)).toBe(true);
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: spaceId,
        }),
      ]),
    );
  });

  it('passe les filtres (type, equipementId, capacityMin, capacityMax) au repository', async () => {
    const result = await useCase.run({
      type: 'MEETING_ROOM',
      equipementId,
      capacityMin: 4,
      capacityMax: 10,
    });

    expect(
      result.find((s) => s.id === spaceId),
    ).toBeTruthy();
  });
});
