import { Inject, Injectable } from '@nestjs/common';
import type { ReservationNotificationPayload } from '../../../notification/domain/entities/reservation-notification.payload';
import type { IReservationsForReminder } from '../../../notification/application/ports/reservations-for-reminder.port';
import type { IReservationRepository } from '../../domain/repositories/reservation.repository.interface';
import { RESERVATION_REPOSITORY } from '../../domain/repositories/reservation.repository.interface';

@Injectable()
export class ReservationsForReminderAdapter implements IReservationsForReminder {
  constructor(
    @Inject(RESERVATION_REPOSITORY)
    private readonly reservationRepository: IReservationRepository,
  ) {}

  async findReservationsStartingBetween(
    start: Date,
    end: Date,
  ): Promise<ReservationNotificationPayload[]> {
    const items = await this.reservationRepository.findReservationsStartingBetween(
      start,
      end,
    );
    return items.map(
      (r): ReservationNotificationPayload => ({
        userId: r.userId,
        userEmail: r.userEmail,
        reservationId: r.id,
        spaceName: r.spaceName,
        startDatetime: r.startDatetime,
        endDatetime: r.endDatetime,
        title: r.title,
      }),
    );
  }
}
