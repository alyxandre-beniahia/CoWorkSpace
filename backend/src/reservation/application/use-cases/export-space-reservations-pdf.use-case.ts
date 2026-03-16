import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { ListReservationsUseCase } from './list-reservations.use-case';
import type { ReservationListFilters } from '../../domain/filters/reservation-list.filters';
import { ReservationPdfService } from '../../infrastructure/pdf/pdf.service';

@Injectable()
export class ExportSpaceReservationsPdfUseCase {
  constructor(
    private readonly listReservationsUseCase: ListReservationsUseCase,
    private readonly prisma: PrismaService,
    private readonly pdfService: ReservationPdfService,
  ) {}

  async run(params: {
    requesterRole: string;
    spaceId: string;
    from: Date;
    to: Date;
  }): Promise<{ buffer: Buffer; filename: string }> {
    const { requesterRole, spaceId, from, to } = params;

    if (requesterRole !== 'admin') {
      throw new ForbiddenException('Seuls les administrateurs peuvent exporter par salle.');
    }

    const filters: ReservationListFilters = {
      spaceId,
      from,
      to,
      role: 'admin',
    };

    const reservations = await this.listReservationsUseCase.run(filters);

    const space = await this.prisma.space.findUnique({
      where: { id: spaceId },
      select: { name: true },
    });

    const spaceName = space?.name ?? 'Salle';

    const buffer = await this.pdfService.buildSpaceReservationsPdf({
      space: { name: spaceName },
      period: { from, to },
      reservations,
    });

    const month = `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, '0')}`;
    const safeName = spaceName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const filename = `reservations-${safeName}-${month}.pdf`;

    return { buffer, filename };
  }
}

