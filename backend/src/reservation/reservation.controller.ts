import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '../auth/infrastructure/jwt-auth.guard';
import { ListReservationsForCalendarUseCase } from './application/list-reservations-for-calendar.use-case';
import { CreateReservationUseCase } from './application/create-reservation.use-case';
import { UpdateReservationUseCase } from './application/update-reservation.use-case';
import { CancelReservationUseCase } from './application/cancel-reservation.use-case';

type AuthRequest = ExpressRequest & { user?: { userId: string; email: string; role: string } };

type ListReservationsQuery = {
  spaceId?: string;
  start?: string;
  end?: string;
};

@Controller('reservations')
@UseGuards(JwtAuthGuard)
export class ReservationController {
  constructor(
    private readonly listReservationsForCalendar: ListReservationsForCalendarUseCase,
    private readonly createReservationUseCase: CreateReservationUseCase,
    private readonly updateReservationUseCase: UpdateReservationUseCase,
    private readonly cancelReservationUseCase: CancelReservationUseCase,
  ) {}

  @Get()
  async listForCalendar(@Query() query: ListReservationsQuery, @Request() req: AuthRequest) {
    const { spaceId, start, end } = query;
    if (!start || !end) {
      throw new BadRequestException('Les paramètres start et end sont obligatoires');
    }
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new BadRequestException('Format de date invalide pour start ou end');
    }
    if (!req.user) {
      throw new BadRequestException('Utilisateur non authentifié');
    }

    return this.listReservationsForCalendar.run({
      spaceId,
      start: startDate,
      end: endDate,
      currentUserId: req.user.userId,
    });
  }

  @Post()
  async create(@Body() body: any, @Request() req: AuthRequest) {
    if (!req.user) {
      throw new BadRequestException('Utilisateur non authentifié');
    }
    const { spaceId, startDatetime, endDatetime, isPrivate, title } = body ?? {};
    if (!spaceId || !startDatetime || !endDatetime) {
      throw new BadRequestException('spaceId, startDatetime et endDatetime sont obligatoires');
    }
    const start = new Date(startDatetime);
    const end = new Date(endDatetime);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new BadRequestException('Format de date invalide pour startDatetime ou endDatetime');
    }
    return this.createReservationUseCase.run({
      spaceId,
      userId: req.user.userId,
      startDatetime: start,
      endDatetime: end,
      isPrivate: !!isPrivate,
      title: title ?? null,
    });
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: any, @Request() req: AuthRequest) {
    if (!req.user) {
      throw new BadRequestException('Utilisateur non authentifié');
    }
    const { startDatetime, endDatetime, title, isPrivate } = body ?? {};

    const start = startDatetime ? new Date(startDatetime) : undefined;
    const end = endDatetime ? new Date(endDatetime) : undefined;

    if (startDatetime && (!start || Number.isNaN(start.getTime()))) {
      throw new BadRequestException('Format de date invalide pour startDatetime');
    }
    if (endDatetime && (!end || Number.isNaN(end.getTime()))) {
      throw new BadRequestException('Format de date invalide pour endDatetime');
    }

    return this.updateReservationUseCase.run({
      reservationId: id,
      userId: req.user.userId,
      userRole: req.user.role,
      startDatetime: start,
      endDatetime: end,
      title: title ?? undefined,
      isPrivate,
    });
  }

  @Delete(':id')
  async cancel(@Param('id') id: string, @Request() req: AuthRequest) {
    if (!req.user) {
      throw new BadRequestException('Utilisateur non authentifié');
    }
    return this.cancelReservationUseCase.run({
      reservationId: id,
      userId: req.user.userId,
      userRole: req.user.role,
    });
  }
}

