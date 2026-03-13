import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ReservationController } from './reservation.controller';
import { ReservationRepository } from './infrastructure/reservation.repository';
import { ListReservationsForCalendarUseCase } from './application/list-reservations-for-calendar.use-case';
import { CreateReservationUseCase } from './application/create-reservation.use-case';
import { UpdateReservationUseCase } from './application/update-reservation.use-case';
import { CancelReservationUseCase } from './application/cancel-reservation.use-case';

@Module({
  imports: [PrismaModule],
  controllers: [ReservationController],
  providers: [
    ReservationRepository,
    ListReservationsForCalendarUseCase,
    CreateReservationUseCase,
    UpdateReservationUseCase,
    CancelReservationUseCase,
  ],
})
export class ReservationModule {}

