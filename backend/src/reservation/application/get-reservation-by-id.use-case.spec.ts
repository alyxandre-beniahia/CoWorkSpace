import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaModule } from '../../database/prisma.module';
import { PrismaService } from '../../database/prisma.service';
import { ReservationModule } from '../reservation.module';
import { CreateReservationUseCase } from './create-reservation.use-case';
import { GetReservationByIdUseCase } from './get-reservation-by-id.use-case';

describe('GetReservationByIdUseCase', () => {
  let useCase: GetReservationByIdUseCase;
  let createUseCase: CreateReservationUseCase;
  let prisma: PrismaService;
  let spaceId: string;
  let userId: string;
  let reservationId: string;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule, ReservationModule],
    }).compile();

    useCase = module.get(GetReservationByIdUseCase);
    createUseCase = module.get(CreateReservationUseCase);
    prisma = module.get(PrismaService);

    const memberRole = await prisma.role.findUnique({ where: { slug: 'member' } });
    if (!memberRole) throw new Error('Rôle member manquant');

    const user = await prisma.user.create({
      data: {
        firstname: 'Get',
        lastname: 'Resa',
        email: `get-resa-${Date.now()}@test.com`,
        password: 'hash',
        isActive: true,
        approvedAt: new Date(),
        roleId: memberRole.id,
      },
    });
    userId = user.id;

    const space = await prisma.space.create({
      data: {
        name: `Salle get-resa ${Date.now()}`,
        code: `GR-${Date.now()}`,
        type: 'MEETING_ROOM',
        capacity: 4,
        status: 'AVAILABLE',
      },
    });
    spaceId = space.id;

    const createdUnion = await createUseCase.run(userId, {
      spaceId,
      startDatetime: new Date('2026-04-05T10:00:00Z').toISOString(),
      endDatetime: new Date('2026-04-05T11:00:00Z').toISOString(),
      title: 'Réunion détail',
    });
    const created = 'first' in createdUnion ? createdUnion.first : createdUnion;
    reservationId = created.id;
  });

  afterEach(async () => {
    await prisma.reservation.deleteMany({ where: { spaceId } });
    await prisma.space.delete({ where: { id: spaceId } });
    await prisma.user.deleteMany({
      where: { email: { startsWith: 'get-resa-' } },
    });
  });

  it('retourne une réservation par son id', async () => {
    const result = await useCase.run(reservationId);

    expect(result).toMatchObject({
      id: reservationId,
      spaceId,
      userId,
      title: 'Réunion détail',
      userName: expect.any(String),
      userEmail: expect.any(String),
    });
  });

  it('lance NotFoundException si réservation inexistante', async () => {
    await expect(useCase.run('unknown-id')).rejects.toThrow(NotFoundException);
  });

  it('ne retourne pas une réservation soft-deleted', async () => {
    await prisma.reservation.update({
      where: { id: reservationId },
      data: { deletedAt: new Date() },
    });

    await expect(useCase.run(reservationId)).rejects.toThrow(NotFoundException);
  });
});
