import { BadRequestException, ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaModule } from '../../prisma/prisma.module';
import { PrismaService } from '../../prisma/prisma.service';
import { ReservationModule } from '../reservation.module';
import { CreateReservationUseCase } from './create-reservation.use-case';

describe('CreateReservationUseCase', () => {
  let useCase: CreateReservationUseCase;
  let prisma: PrismaService;
  let spaceId: string;
  let userId: string;
  const baseStart = new Date('2026-04-01T10:00:00Z');
  const baseEnd = new Date('2026-04-01T11:00:00Z');

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule, ReservationModule],
    }).compile();

    useCase = module.get(CreateReservationUseCase);
    prisma = module.get(PrismaService);

    const memberRole = await prisma.role.findUnique({ where: { slug: 'member' } });
    if (!memberRole) throw new Error('Rôle member manquant');

    const user = await prisma.user.create({
      data: {
        firstname: 'Resa',
        lastname: 'Test',
        email: `create-resa-${Date.now()}@test.com`,
        password: 'hash',
        isActive: true,
        approvedAt: new Date(),
        roleId: memberRole.id,
      },
    });
    userId = user.id;

    const space = await prisma.space.create({
      data: {
        name: `Salle create-resa ${Date.now()}`,
        code: `CR-${Date.now()}`,
        type: 'MEETING_ROOM',
        capacity: 4,
        status: 'AVAILABLE',
      },
    });
    spaceId = space.id;
  });

  afterEach(async () => {
    await prisma.reservation.deleteMany({ where: { spaceId } });
    await prisma.space.delete({ where: { id: spaceId } });
    await prisma.user.deleteMany({
      where: { email: { startsWith: 'create-resa-' } },
    });
  });

  it('crée une réservation avec succès', async () => {
    const resultUnion = await useCase.run(userId, {
      spaceId,
      startDatetime: baseStart.toISOString(),
      endDatetime: baseEnd.toISOString(),
      title: 'Réunion test',
    } as any);

    const result = 'first' in resultUnion ? resultUnion.first : resultUnion;

    expect(result).toMatchObject({
      spaceId,
      spaceName: expect.any(String),
      userId,
      title: 'Réunion test',
      isPrivate: false,
    });
    expect(new Date(result.startDatetime).getTime()).toBe(baseStart.getTime());
    expect(new Date(result.endDatetime).getTime()).toBe(baseEnd.getTime());

    const inDb = await prisma.reservation.findFirst({
      where: { id: result.id, deletedAt: null },
    });
    expect(inDb).toBeTruthy();
  });

  it('lance BadRequestException si date de fin <= date de début', async () => {
    await expect(
      useCase.run(userId, {
        spaceId,
        startDatetime: baseEnd.toISOString(),
        endDatetime: baseStart.toISOString(),
      } as any),
    ).rejects.toThrow(BadRequestException);
  });

  it('lance ConflictException si créneau chevauche une réservation existante', async () => {
    await useCase.run(userId, {
      spaceId,
      startDatetime: baseStart.toISOString(),
      endDatetime: baseEnd.toISOString(),
    } as any);

    await expect(
      useCase.run(userId, {
        spaceId,
        startDatetime: new Date('2026-04-01T10:30:00Z').toISOString(),
        endDatetime: new Date('2026-04-01T11:30:00Z').toISOString(),
      } as any),
    ).rejects.toThrow(ConflictException);
  });

  it('crée une réservation récurrente avec succès', async () => {
    const recurrenceEndAt = new Date('2026-04-05T23:59:59Z');

    const result = await useCase.run(userId, {
      spaceId,
      startDatetime: baseStart.toISOString(),
      endDatetime: baseEnd.toISOString(),
      recurrenceRule: 'FREQ=DAILY',
      recurrenceEndAt: recurrenceEndAt.toISOString(),
      title: 'Réunion récurrente',
    } as any) as { created: number; recurrenceGroupId: string; first: any };

    expect(result).toHaveProperty('created');
    expect(result).toHaveProperty('recurrenceGroupId');
    expect(result).toHaveProperty('first');
    expect(result.created).toBeGreaterThanOrEqual(1);
    expect(result.first).toMatchObject({
      spaceId,
      title: 'Réunion récurrente',
    });

    const inDb = await prisma.reservation.findMany({
      where: { recurrenceGroupId: result.recurrenceGroupId, deletedAt: null },
    });
    expect(inDb.length).toBe(result.created);
  });

  it('lance BadRequestException si recurrenceEndAt <= startDatetime', async () => {
    const recurrenceEndAt = new Date('2026-03-31T09:00:00Z');

    try {
      await useCase.run(userId, {
        spaceId,
        startDatetime: baseStart.toISOString(),
        endDatetime: baseEnd.toISOString(),
        recurrenceRule: 'FREQ=DAILY',
        recurrenceEndAt: recurrenceEndAt.toISOString(),
      } as any);
    } catch (e: any) {
      expect(e).toBeInstanceOf(BadRequestException);
      const msg = e.response?.message ?? e.message ?? '';
      expect(String(msg)).toContain('récurrence');
    }
  });

  it('lance ConflictException avec date dans le message si une occurrence chevauche', async () => {
    await useCase.run(userId, {
      spaceId,
      startDatetime: new Date('2026-04-02T10:00:00Z').toISOString(),
      endDatetime: new Date('2026-04-02T11:00:00Z').toISOString(),
      title: 'Résa fixe',
    } as any);

    const recurrenceEndAt = new Date('2026-04-05T23:59:59Z');

    let thrown: any;
    try {
      await useCase.run(userId, {
        spaceId,
        startDatetime: baseStart.toISOString(),
        endDatetime: baseEnd.toISOString(),
        recurrenceRule: 'FREQ=DAILY',
        recurrenceEndAt: recurrenceEndAt.toISOString(),
        title: 'Série',
      } as any);
    } catch (e) {
      thrown = e;
    }

    expect(thrown).toBeDefined();
    expect(thrown).toBeInstanceOf(ConflictException);
    expect(thrown.message).toContain('Impossible de créer la série');
    expect(thrown.message).toContain('déjà réservé');
    expect(thrown.message).toMatch(/\d/);
  });
});

