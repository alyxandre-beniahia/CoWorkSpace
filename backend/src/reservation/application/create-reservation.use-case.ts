import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export type CreateReservationInput = {
  spaceId: string;
  userId: string;
  startDatetime: Date;
  endDatetime: Date;
  isPrivate?: boolean;
  title?: string | null;
};

@Injectable()
export class CreateReservationUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async run(input: CreateReservationInput) {
    const { spaceId, userId, startDatetime, endDatetime, isPrivate = false, title = null } = input;

    if (endDatetime <= startDatetime) {
      throw new BadRequestException('La date de fin doit être postérieure à la date de début');
    }

    const overlapping = await this.prisma.reservation.findFirst({
      where: {
        spaceId,
        deletedAt: null,
        // chevauchement avec [startDatetime, endDatetime]
        startDatetime: { lt: endDatetime },
        endDatetime: { gt: startDatetime },
      },
    });

    if (overlapping) {
      throw new BadRequestException('Le créneau sélectionné est déjà réservé');
    }

    return this.prisma.reservation.create({
      data: {
        spaceId,
        userId,
        startDatetime,
        endDatetime,
        isPrivate,
        title,
      },
    });
  }
}

