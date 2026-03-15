import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { CreateReservationUseCase } from '../../../application/use-cases/create-reservation.use-case';
import { UpdateReservationUseCase } from '../../../application/use-cases/update-reservation.use-case';
import { CancelReservationUseCase } from '../../../application/use-cases/cancel-reservation.use-case';
import { ListReservationsUseCase } from '../../../application/use-cases/list-reservations.use-case';
import { GetReservationByIdUseCase } from '../../../application/use-cases/get-reservation-by-id.use-case';
import { ListReservationsForCalendarUseCase } from '../../../application/use-cases/list-reservations-for-calendar.use-case';
import type { CreateReservationDto } from '../../../application/dtos/create-reservation.dto';
import type { UpdateReservationDto } from '../../../application/dtos/update-reservation.dto';
import type { ReservationListFilters } from '../../../domain/filters/reservation-list.filters';
import { RESERVATION_PREFIX, RESERVATION_ROUTES } from '../routes/reservation.routes';
import { mapReservationDomainErrorToHttp } from '../middlewares/reservation-error-mapper';

type AuthRequest = ExpressRequest & { user: { userId: string; email: string; role: string } };

@Controller(RESERVATION_PREFIX)
export class ReservationController {
  constructor(
    private readonly createReservationUseCase: CreateReservationUseCase,
    private readonly updateReservationUseCase: UpdateReservationUseCase,
    private readonly cancelReservationUseCase: CancelReservationUseCase,
    private readonly listReservationsUseCase: ListReservationsUseCase,
    private readonly getReservationByIdUseCase: GetReservationByIdUseCase,
    private readonly listReservationsForCalendarUseCase: ListReservationsForCalendarUseCase,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Request() req: AuthRequest, @Body() dto: CreateReservationDto) {
    try {
      return await this.createReservationUseCase.run(req.user.userId, dto, req.user.role);
    } catch (err) {
      mapReservationDomainErrorToHttp(err);
    }
  }

  @Get(RESERVATION_ROUTES.CALENDAR) // avant GET :id pour ne pas matcher "calendar" comme id
  @UseGuards(JwtAuthGuard)
  async listCalendar(
    @Query('spaceId') spaceId?: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    if (!start || !end) {
      return this.listReservationsForCalendarUseCase.run({
        spaceId: spaceId ?? undefined,
        start: start ? new Date(start) : new Date(0),
        end: end ? new Date(end) : new Date(),
      });
    }
    return this.listReservationsForCalendarUseCase.run({
      spaceId: spaceId ?? undefined,
      start: new Date(start),
      end: new Date(end),
    });
  }

  @Get(RESERVATION_ROUTES.LIST)
  @UseGuards(JwtAuthGuard)
  async list(
    @Query('userId') userId?: string,
    @Query('spaceId') spaceId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Query('forPlan') forPlan?: string,
    @Request() req?: AuthRequest,
  ) {
    const filters: ReservationListFilters = {};
    if (userId) filters.userId = userId;
    if (spaceId) filters.spaceId = spaceId;
    const fromVal = from ?? start;
    const toVal = to ?? end;
    if (fromVal) filters.from = new Date(fromVal);
    if (toVal) filters.to = new Date(toVal);
    if (req?.user) {
      filters.currentUserId = req.user.userId;
      filters.role = req.user.role;
    }
    // forPlan=true : retourner toutes les réservations sur la plage (pour le plan d'accueil, couleurs par espace)
    const isForPlan = forPlan === 'true' || forPlan === '1';
    if (req?.user?.role !== 'admin' && !filters.userId && !filters.spaceId && !isForPlan) {
      filters.userId = req!.user.userId;
    }
    return this.listReservationsUseCase.run(filters);
  }

  @Get(RESERVATION_ROUTES.BY_ID)
  @UseGuards(JwtAuthGuard)
  async getById(@Param('id') id: string, @Request() req: AuthRequest) {
    try {
      return await this.getReservationByIdUseCase.run(id, req.user.userId, req.user.role);
    } catch (err) {
      mapReservationDomainErrorToHttp(err);
    }
  }

  @Patch(RESERVATION_ROUTES.BY_ID)
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Request() req: AuthRequest,
    @Body() dto: UpdateReservationDto,
  ) {
    try {
      return await this.updateReservationUseCase.run(id, req.user.userId, dto, req.user.role);
    } catch (err) {
      mapReservationDomainErrorToHttp(err);
    }
  }

  @Patch(RESERVATION_ROUTES.CANCEL)
  @UseGuards(JwtAuthGuard)
  async cancel(
    @Param('id') id: string,
    @Query('scope') scope?: string,
    @Request() req?: AuthRequest,
  ) {
    try {
      const cancelScope = scope === 'all' ? 'all' : 'this';
      return await this.cancelReservationUseCase.run(
        id,
        req!.user.userId,
        cancelScope,
        req!.user.role,
      );
    } catch (err) {
      mapReservationDomainErrorToHttp(err);
    }
  }
}
