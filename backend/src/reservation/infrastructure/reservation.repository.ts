import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { IReservationRepository, ReservationCalendarItem } from '../domain/reservation.repository.interface';

@Injectable()
export class ReservationRepository implements IReservationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listForCalendar(params: {
    spaceId?: string;
    start: Date;
    end: Date;
  }): Promise<ReservationCalendarItem[]> {
    const { spaceId, start, end } = params;

    const reservations = await this.prisma.reservation.findMany({
      where: {
        deletedAt: null,
        ...(spaceId && { spaceId }),
        // chevauchement avec [start, end]
        startDatetime: { lt: end },
        endDatetime: { gt: start },
      },
      select: {
        id: true,
        spaceId: true,
        userId: true,
        startDatetime: true,
        endDatetime: true,
        isPrivate: true,
        title: true,
      },
      orderBy: { startDatetime: 'asc' },
    });

    return reservations as unknown as ReservationCalendarItem[];
  }
}

