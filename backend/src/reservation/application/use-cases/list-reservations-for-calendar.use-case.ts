import type { IReservationRepository } from '../../domain/repositories/reservation.repository.interface';

export class ListReservationsForCalendarUseCase {
  constructor(private readonly reservationRepository: IReservationRepository) {}

  async run(params: { spaceId?: string; start: Date; end: Date }) {
    return this.reservationRepository.listForCalendar(params);
  }
}
