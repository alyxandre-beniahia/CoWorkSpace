import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Request,
  Res,
  StreamableFile,
} from '@nestjs/common';
import type { Response as ExpressResponse, Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { ListReservationsUseCase } from '../../../../reservation/application/use-cases/list-reservations.use-case';
import { ExportSpaceReservationsPdfUseCase } from '../../../../reservation/application/use-cases/export-space-reservations-pdf.use-case';
import type { ReservationListFilters } from '../../../../reservation/domain/filters/reservation-list.filters';

type AuthRequest = ExpressRequest & { user: { userId: string; email: string; role: string } };

@Controller('admin/spaces')
export class AdminReservationsController {
  constructor(
    private readonly listReservationsUseCase: ListReservationsUseCase,
    private readonly exportSpaceReservationsPdfUseCase: ExportSpaceReservationsPdfUseCase,
  ) {}

  @Get(':spaceId/reservations')
  @UseGuards(JwtAuthGuard)
  async listForSpace(
    @Param('spaceId') spaceId: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @Request() req: AuthRequest,
  ) {
    if (!from || !to) {
      throw new Error('from and to query parameters are required');
    }

    const filters: ReservationListFilters = {
      spaceId,
      from: new Date(from),
      to: new Date(to),
      currentUserId: req.user.userId,
      role: req.user.role,
    };

    return this.listReservationsUseCase.run(filters);
  }

  @Get(':spaceId/reservations/export')
  @UseGuards(JwtAuthGuard)
  async exportForSpace(
    @Param('spaceId') spaceId: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @Request() req: AuthRequest,
    @Res({ passthrough: true }) res: ExpressResponse,
  ): Promise<StreamableFile> {
    if (!from || !to) {
      throw new Error('from and to query parameters are required');
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);

    const { buffer, filename } = await this.exportSpaceReservationsPdfUseCase.run({
      requesterRole: req.user.role,
      spaceId,
      from: fromDate,
      to: toDate,
    });

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    return new StreamableFile(buffer);
  }
}

