import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { ListReservationsUseCase } from './list-reservations.use-case';
import type { ReservationListFilters } from '../../domain/filters/reservation-list.filters';
import { ReservationPdfService } from '../../infrastructure/pdf/pdf.service';

@Injectable()
export class ExportMyReservationsPdfUseCase {
  constructor(
    private readonly listReservationsUseCase: ListReservationsUseCase,
    private readonly prisma: PrismaService,
    private readonly pdfService: ReservationPdfService,
  ) {}

  async run(params: {
    userId: string;
    from?: Date;
    to?: Date;
  }): Promise<{ buffer: Buffer; filename: string }> {
    const { userId, from, to } = params;

    const filters: ReservationListFilters = {
      userId,
      from,
      to,
      currentUserId: userId,
      role: 'member',
    };

    const reservations = await this.listReservationsUseCase.run(filters);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { firstname: true, lastname: true, email: true },
    });

    const fullname = user ? `${user.firstname} ${user.lastname}` : 'Utilisateur';
    const email = user?.email ?? '';

    const buffer = await this.pdfService.buildUserReservationsPdf({
      user: { fullname, email },
      period: { from, to },
      reservations,
    });

    const start = from ?? (reservations[0]?.startDatetime ?? new Date());
    const month = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`;
    const filename = `mes-reservations-${month}.pdf`;

    return { buffer, filename };
  }
}

