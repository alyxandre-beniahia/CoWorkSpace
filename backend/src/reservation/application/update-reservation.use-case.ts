import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export type UpdateReservationInput = {
  reservationId: string;
  userId: string;
  userRole: string;
  startDatetime?: Date;
  endDatetime?: Date;
  title?: string | null;
  isPrivate?: boolean;
};

@Injectable()
export class UpdateReservationUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async run(input: UpdateReservationInput) {
    const { reservationId, userId, userRole, startDatetime, endDatetime, title, isPrivate } = input;

    const existing = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
    });
    if (!existing || existing.deletedAt) {
      throw new NotFoundException('Réservation introuvable');
    }

    const isOwner = existing.userId === userId;
    const isAdmin = userRole === 'admin';
    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('Vous ne pouvez pas modifier cette réservation');
    }

    const newStart = startDatetime ?? existing.startDatetime;
    const newEnd = endDatetime ?? existing.endDatetime;

    if (newEnd <= newStart) {
      throw new BadRequestException('La date de fin doit être postérieure à la date de début');
    }

    const overlapping = await this.prisma.reservation.findFirst({
      where: {
        spaceId: existing.spaceId,
        deletedAt: null,
        id: { not: reservationId },
        startDatetime: { lt: newEnd },
        endDatetime: { gt: newStart },
      },
    });

    if (overlapping) {
      throw new BadRequestException('Le créneau sélectionné est déjà réservé');
    }

    return this.prisma.reservation.update({
      where: { id: reservationId },
      data: {
        startDatetime: newStart,
        endDatetime: newEnd,
        ...(title !== undefined && { title }),
        ...(isPrivate !== undefined && { isPrivate }),
      },
    });
  }
}

