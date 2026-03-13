import { Injectable, NotFoundException } from '@nestjs/common';
import { ReservationRepository } from '../infrastructure/reservation.repository';

@Injectable()
export class GetReservationByIdUseCase {
  constructor(private readonly reservationRepository: ReservationRepository) {}

  async run(id: string, currentUserId?: string) {
    const reservation = await this.reservationRepository.findById(id, currentUserId);
    if (!reservation) {
      throw new NotFoundException('Réservation introuvable.');
    }
    return reservation;
  }
}
