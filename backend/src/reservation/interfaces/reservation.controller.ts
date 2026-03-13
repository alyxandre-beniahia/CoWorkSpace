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
import { JwtAuthGuard } from '../../auth/infrastructure/jwt-auth.guard';
import { CreateReservationUseCase } from '../application/create-reservation.use-case';
import { UpdateReservationUseCase } from '../application/update-reservation.use-case';
import { CancelReservationUseCase } from '../application/cancel-reservation.use-case';
import { ListReservationsUseCase } from '../application/list-reservations.use-case';
import { GetReservationByIdUseCase } from '../application/get-reservation-by-id.use-case';
import { CreateReservationDto } from '../application/dto/create-reservation.dto';
import { UpdateReservationDto } from '../application/dto/update-reservation.dto';

type AuthRequest = ExpressRequest & { user: { userId: string; email: string; role: string } };

@Controller('reservations')
export class ReservationController {
  constructor(
    private readonly createReservationUseCase: CreateReservationUseCase,
    private readonly updateReservationUseCase: UpdateReservationUseCase,
    private readonly cancelReservationUseCase: CancelReservationUseCase,
    private readonly listReservationsUseCase: ListReservationsUseCase,
    private readonly getReservationByIdUseCase: GetReservationByIdUseCase,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Request() req: AuthRequest, @Body() dto: CreateReservationDto) {
    return this.createReservationUseCase.run(req.user.userId, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async list(
    @Query('userId') userId?: string,
    @Query('spaceId') spaceId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Request() req?: AuthRequest,
  ) {
    const filters: { userId?: string; spaceId?: string; from?: Date; to?: Date; currentUserId?: string } = {};
    if (userId) filters.userId = userId;
    if (spaceId) filters.spaceId = spaceId;
    if (from) filters.from = new Date(from);
    if (to) filters.to = new Date(to);
    if (req?.user) filters.currentUserId = req.user.userId;
    // Par défaut, un membre ne voit que ses réservations (sauf si spaceId fourni = vue calendrier d'un espace)
    if (req?.user?.role !== 'admin' && !filters.userId && !filters.spaceId) {
      filters.userId = req!.user.userId;
    }
    return this.listReservationsUseCase.run(filters);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getById(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.getReservationByIdUseCase.run(id, req.user.userId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Request() req: AuthRequest,
    @Body() dto: UpdateReservationDto,
  ) {
    return this.updateReservationUseCase.run(id, req.user.userId, dto);
  }

  @Patch(':id/annuler')
  @UseGuards(JwtAuthGuard)
  async cancel(
    @Param('id') id: string,
    @Query('scope') scope?: string,
    @Request() req?: AuthRequest,
  ) {
    const cancelScope = scope === 'all' ? 'all' : 'this';
    return this.cancelReservationUseCase.run(id, req!.user.userId, cancelScope);
  }
}
