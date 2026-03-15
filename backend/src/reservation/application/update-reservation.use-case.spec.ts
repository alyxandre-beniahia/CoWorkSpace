import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaModule } from '../../database/prisma.module';
import { PrismaService } from '../../database/prisma.service';
import { ReservationModule } from '../reservation.module';
import { CreateReservationUseCase } from './create-reservation.use-case';
import { UpdateReservationUseCase } from './update-reservation.use-case';

describe('UpdateReservationUseCase', () => {
  let useCase: UpdateReservationUseCase;
  let createUseCase: CreateReservationUseCase;
  let prisma: PrismaService;
  let spaceId: string;
  let userId: string;
  let otherUserId: string;
  let reservationId: string;
  let ownerEmail: string;
  let otherEmail: string;
  const baseStart = new Date('2026-04-02T10:00:00Z');
  const baseEnd = new Date('2026-04-02T11:00:00Z');

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule, ReservationModule],
    }).compile();

    useCase = module.get(UpdateReservationUseCase);
    createUseCase = module.get(CreateReservationUseCase);
    prisma = module.get(PrismaService);

    const memberRole = await prisma.role.findUnique({ where: { slug: 'member' } });
    if (!memberRole) throw new Error('Rôle member manquant');

    ownerEmail = `update-owner-${Date.now()}@test.com`;
    const user = await prisma.user.create({
      data: {
        firstname: 'Update',
        lastname: 'Owner',
        email: ownerEmail,
        password: 'hash',
        isActive: true,
        approvedAt: new Date(),
        roleId: memberRole.id,
      },
    });
    userId = user.id;

    otherEmail = `update-other-${Date.now()}@test.com`;
    const otherUser = await prisma.user.create({
      data: {
        firstname: 'Other',
        lastname: 'User',
        email: otherEmail,
        password: 'hash',
        isActive: true,
        approvedAt: new Date(),
        roleId: memberRole.id,
      },
    });
    otherUserId = otherUser.id;

    const space = await prisma.space.create({
      data: {
        name: `Salle update-resa ${Date.now()}`,
        code: `UR-${Date.now()}`,
        type: 'MEETING_ROOM',
        capacity: 4,
        status: 'AVAILABLE',
      },
    });
    spaceId = space.id;

    const createdUnion = await createUseCase.run(userId, {
      spaceId,
      startDatetime: baseStart.toISOString(),
      endDatetime: baseEnd.toISOString(),
      title: 'Réunion initiale',
    });
    const created = 'first' in createdUnion ? createdUnion.first : createdUnion;
    reservationId = created.id;
  });

  afterEach(async () => {
    await prisma.reservation.deleteMany({ where: { spaceId } });
    await prisma.space.delete({ where: { id: spaceId } });
    await prisma.user.deleteMany({
      where: { email: { in: [ownerEmail, otherEmail] } },
    });
  });

  it('met à jour une réservation avec succès', async () => {
    const newStart = new Date('2026-04-02T14:00:00Z');
    const newEnd = new Date('2026-04-02T15:00:00Z');

    const result = await useCase.run(reservationId, userId, {
      startDatetime: newStart.toISOString(),
      endDatetime: newEnd.toISOString(),
      title: 'Réunion modifiée',
    });

    expect(result?.title).toBe('Réunion modifiée');
    expect(new Date(result!.startDatetime).getTime()).toBe(newStart.getTime());
    expect(new Date(result!.endDatetime).getTime()).toBe(newEnd.getTime());
  });

  it('lance NotFoundException si réservation inexistante', async () => {
    await expect(
      useCase.run('unknown-id', userId, { title: 'Test' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('lance ForbiddenException si l\'utilisateur ne possède pas la réservation', async () => {
    await expect(
      useCase.run(reservationId, otherUserId, { title: 'Test' }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('lance ConflictException si date de fin <= date de début', async () => {
    await expect(
      useCase.run(reservationId, userId, {
        startDatetime: baseEnd.toISOString(),
        endDatetime: baseStart.toISOString(),
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('lance ConflictException si le nouveau créneau chevauche une autre réservation', async () => {
    await createUseCase.run(otherUserId, {
      spaceId,
      startDatetime: new Date('2026-04-02T14:00:00Z').toISOString(),
      endDatetime: new Date('2026-04-02T15:00:00Z').toISOString(),
    });

    await expect(
      useCase.run(reservationId, userId, {
        startDatetime: new Date('2026-04-02T14:30:00Z').toISOString(),
        endDatetime: new Date('2026-04-02T15:30:00Z').toISOString(),
      }),
    ).rejects.toThrow(ConflictException);
  });
});
