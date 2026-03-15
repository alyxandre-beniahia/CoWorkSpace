import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ReservationController } from './infrastructure/http/controllers/reservation.controller';
import { ReservationRepository } from './infrastructure/repositories/reservation.repository';
import { UuidGeneratorAdapter } from './infrastructure/adapters/uuid-generator.adapter';
import { RecurrenceExpanderAdapter } from './infrastructure/adapters/recurrence-expander.adapter';
import { CreateReservationUseCase } from './application/use-cases/create-reservation.use-case';
import { UpdateReservationUseCase } from './application/use-cases/update-reservation.use-case';
import { CancelReservationUseCase } from './application/use-cases/cancel-reservation.use-case';
import { ListReservationsUseCase } from './application/use-cases/list-reservations.use-case';
import { GetReservationByIdUseCase } from './application/use-cases/get-reservation-by-id.use-case';
import { ListReservationsForCalendarUseCase } from './application/use-cases/list-reservations-for-calendar.use-case';
import { RESERVATION_REPOSITORY } from './domain/repositories/reservation.repository.interface';
import { RESERVATION_ID_GENERATOR } from './application/ports/id-generator.port';
import { RESERVATION_RECURRENCE_EXPANDER } from './application/ports/recurrence-expander.port';
import type { IReservationRepository } from './domain/repositories/reservation.repository.interface';
import type { IIdGenerator } from './application/ports/id-generator.port';
import type { IRecurrenceExpander } from './application/ports/recurrence-expander.port';

@Module({
  imports: [AuthModule],
  controllers: [ReservationController],
  providers: [
    {
      provide: RESERVATION_REPOSITORY,
      useClass: ReservationRepository,
    },
    {
      provide: RESERVATION_ID_GENERATOR,
      useClass: UuidGeneratorAdapter,
    },
    {
      provide: RESERVATION_RECURRENCE_EXPANDER,
      useClass: RecurrenceExpanderAdapter,
    },
    {
      provide: CreateReservationUseCase,
      useFactory: (
        reservationRepository: IReservationRepository,
        idGenerator: IIdGenerator,
        recurrenceExpander: IRecurrenceExpander,
      ) =>
        new CreateReservationUseCase(
          reservationRepository,
          idGenerator,
          recurrenceExpander,
        ),
      inject: [RESERVATION_REPOSITORY, RESERVATION_ID_GENERATOR, RESERVATION_RECURRENCE_EXPANDER],
    },
    {
      provide: UpdateReservationUseCase,
      useFactory: (reservationRepository: IReservationRepository) =>
        new UpdateReservationUseCase(reservationRepository),
      inject: [RESERVATION_REPOSITORY],
    },
    {
      provide: CancelReservationUseCase,
      useFactory: (reservationRepository: IReservationRepository) =>
        new CancelReservationUseCase(reservationRepository),
      inject: [RESERVATION_REPOSITORY],
    },
    {
      provide: ListReservationsUseCase,
      useFactory: (reservationRepository: IReservationRepository) =>
        new ListReservationsUseCase(reservationRepository),
      inject: [RESERVATION_REPOSITORY],
    },
    {
      provide: GetReservationByIdUseCase,
      useFactory: (reservationRepository: IReservationRepository) =>
        new GetReservationByIdUseCase(reservationRepository),
      inject: [RESERVATION_REPOSITORY],
    },
    {
      provide: ListReservationsForCalendarUseCase,
      useFactory: (reservationRepository: IReservationRepository) =>
        new ListReservationsForCalendarUseCase(reservationRepository),
      inject: [RESERVATION_REPOSITORY],
    },
  ],
})
export class ReservationModule {}
