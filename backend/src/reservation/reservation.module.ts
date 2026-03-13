import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ReservationController } from './interfaces/reservation.controller';
import { CreateReservationUseCase } from './application/create-reservation.use-case';
import { UpdateReservationUseCase } from './application/update-reservation.use-case';
import { CancelReservationUseCase } from './application/cancel-reservation.use-case';
import { ListReservationsUseCase } from './application/list-reservations.use-case';
import { GetReservationByIdUseCase } from './application/get-reservation-by-id.use-case';
import { ReservationRepository } from './infrastructure/reservation.repository';

@Module({
  imports: [AuthModule],
  controllers: [ReservationController],
  providers: [
    ReservationRepository,
    CreateReservationUseCase,
    UpdateReservationUseCase,
    CancelReservationUseCase,
    ListReservationsUseCase,
    GetReservationByIdUseCase,
  ],
})
export class ReservationModule {}

