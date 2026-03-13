import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export type CancelReservationInput = {
  reservationId: string;
  userId: string;
  userRole: string;
};

@Injectable()
export class CancelReservationUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async run(input: CancelReservationInput) {
    const { reservationId, userId, userRole } = input;

    const existing = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
    });
    if (!existing || existing.deletedAt) {
      throw new NotFoundException('Réservation introuvable');
    }

    const isOwner = existing.userId === userId;
    const isAdmin = userRole === 'admin';
    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('Vous ne pouvez pas annuler cette réservation');
    }

    return this.prisma.reservation.update({
      where: { id: reservationId },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}

