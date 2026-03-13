import { Test, TestingModule } from '@nestjs/testing';
import { PrismaModule } from '../../prisma/prisma.module';
import { PrismaService } from '../../prisma/prisma.service';
import { ReservationModule } from '../reservation.module';
import { CreateReservationUseCase } from './create-reservation.use-case';
import { ListReservationsUseCase } from './list-reservations.use-case';

describe('ListReservationsUseCase', () => {
  let useCase: ListReservationsUseCase;
  let createUseCase: CreateReservationUseCase;
  let prisma: PrismaService;
  let spaceId: string;
  let userId: string;
  const baseStart = new Date('2026-04-04T10:00:00Z');
  const baseEnd = new Date('2026-04-04T11:00:00Z');

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule, ReservationModule],
    }).compile();

    useCase = module.get(ListReservationsUseCase);
    createUseCase = module.get(CreateReservationUseCase);
    prisma = module.get(PrismaService);

    const memberRole = await prisma.role.findUnique({ where: { slug: 'member' } });
    if (!memberRole) throw new Error('Rôle member manquant');

    const user = await prisma.user.create({
      data: {
        firstname: 'List',
        lastname: 'Resa',
        email: `list-resa-${Date.now()}@test.com`,
        password: 'hash',
        isActive: true,
        approvedAt: new Date(),
        roleId: memberRole.id,
      },
    });
    userId = user.id;

    const space = await prisma.space.create({
      data: {
        name: `Salle list-resa ${Date.now()}`,
        code: `LR-${Date.now()}`,
        type: 'MEETING_ROOM',
        capacity: 4,
        status: 'AVAILABLE',
      },
    });
    spaceId = space.id;

    await createUseCase.run(userId, {
      spaceId,
      startDatetime: baseStart.toISOString(),
      endDatetime: baseEnd.toISOString(),
      title: 'Réunion liste',
    });
  });

  afterEach(async () => {
    await prisma.reservation.deleteMany({ where: { spaceId } });
    await prisma.space.delete({ where: { id: spaceId } });
    await prisma.user.deleteMany({
      where: { email: { startsWith: 'list-resa-' } },
    });
  });

  it('retourne la liste des réservations filtrée par userId', async () => {
    const result = await useCase.run({ userId });

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          userId,
          spaceId,
          title: 'Réunion liste',
        }),
      ]),
    );
  });

  it('retourne la liste des réservations filtrée par spaceId', async () => {
    const result = await useCase.run({ spaceId });

    expect(result.some((r) => r.spaceId === spaceId)).toBe(true);
  });

  it('retourne la liste des réservations filtrée par plage de dates', async () => {
    const result = await useCase.run({
      from: new Date('2026-04-04T00:00:00Z'),
      to: new Date('2026-04-04T23:59:59Z'),
    });

    expect(result.length).toBeGreaterThanOrEqual(1);
  });
});
