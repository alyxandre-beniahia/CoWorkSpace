import type { IReservationRepository } from '../../domain/repositories/reservation.repository.interface';
import type { ReservationListFilters } from '../../domain/filters/reservation-list.filters';

export class ListReservationsUseCase {
  constructor(private readonly reservationRepository: IReservationRepository) {}

  async run(filters: ReservationListFilters) {
    return this.reservationRepository.list(filters);
  }
}
