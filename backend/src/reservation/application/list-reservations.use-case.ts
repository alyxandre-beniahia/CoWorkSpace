import { Injectable } from '@nestjs/common';
import { ReservationRepository } from '../infrastructure/reservation.repository';
import type { ReservationListFilters } from '../domain/reservation-list.filters';

@Injectable()
export class ListReservationsUseCase {
  constructor(private readonly reservationRepository: ReservationRepository) {}

  async run(filters: ReservationListFilters) {
    return this.reservationRepository.list(filters);
  }
}
