import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaModule } from '../../database/prisma.module';
import { PrismaService } from '../../database/prisma.service';
import { ReservationModule } from '../reservation.module';
import { CreateReservationUseCase } from './create-reservation.use-case';
import { CancelReservationUseCase } from './cancel-reservation.use-case';

describe('CancelReservationUseCase', () => {
  let useCase: CancelReservationUseCase;
  let createUseCase: CreateReservationUseCase;
  let prisma: PrismaService;
  let spaceId: string;
  let userId: string;
  let otherUserId: string;
  let reservationId: string;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule, ReservationModule],
    }).compile();

    useCase = module.get(CancelReservationUseCase);
    createUseCase = module.get(CreateReservationUseCase);
    prisma = module.get(PrismaService);

    const memberRole = await prisma.role.findUnique({ where: { slug: 'member' } });
    if (!memberRole) throw new Error('Rôle member manquant');

    const user = await prisma.user.create({
      data: {
        firstname: 'Cancel',
        lastname: 'Owner',
        email: `cancel-owner-${Date.now()}@test.com`,
        password: 'hash',
        isActive: true,
        approvedAt: new Date(),
        roleId: memberRole.id,
      },
    });
    userId = user.id;

    const otherUser = await prisma.user.create({
      data: {
        firstname: 'Other',
        lastname: 'User',
        email: `cancel-other-${Date.now()}@test.com`,
        password: 'hash',
        isActive: true,
        approvedAt: new Date(),
        roleId: memberRole.id,
      },
    });
    otherUserId = otherUser.id;

    const space = await prisma.space.create({
      data: {
        name: `Salle cancel-resa ${Date.now()}`,
        code: `CL-${Date.now()}`,
        type: 'MEETING_ROOM',
        capacity: 4,
        status: 'AVAILABLE',
      },
    });
    spaceId = space.id;

    const createdUnion = await createUseCase.run(userId, {
      spaceId,
      startDatetime: new Date('2026-04-03T10:00:00Z').toISOString(),
      endDatetime: new Date('2026-04-03T11:00:00Z').toISOString(),
    });
    const created = 'first' in createdUnion ? createdUnion.first : createdUnion;
    reservationId = created.id;
  });

  afterEach(async () => {
    await prisma.reservation.deleteMany({ where: { spaceId } });
    await prisma.space.delete({ where: { id: spaceId } });
    await prisma.user.deleteMany({
      where: { email: { startsWith: 'cancel-' } },
    });
  });

  it('annule une réservation avec succès (soft delete)', async () => {
    const result = await useCase.run(reservationId, userId);

    expect(result.success).toBe(true);

    const inDb = await prisma.reservation.findUnique({
      where: { id: reservationId },
    });
    expect(inDb?.deletedAt).not.toBeNull();
  });

  it('lance NotFoundException si réservation inexistante', async () => {
    await expect(useCase.run('unknown-id', userId)).rejects.toThrow(NotFoundException);
  });

  it('lance ForbiddenException si l\'utilisateur ne possède pas la réservation', async () => {
    await expect(useCase.run(reservationId, otherUserId)).rejects.toThrow(ForbiddenException);
  });
});
