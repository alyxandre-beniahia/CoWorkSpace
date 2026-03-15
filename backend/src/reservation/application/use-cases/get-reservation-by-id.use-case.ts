import type { IReservationRepository } from '../../domain/repositories/reservation.repository.interface';
import { ReservationNotFoundError } from '../../domain/errors/reservation.errors';

export class GetReservationByIdUseCase {
  constructor(private readonly reservationRepository: IReservationRepository) {}

  async run(id: string, currentUserId?: string, role?: string) {
    const unmaskPrivate = role === 'admin';
    const reservation = await this.reservationRepository.findById(id, currentUserId, {
      unmaskPrivate,
    });
    if (!reservation) {
      throw new ReservationNotFoundError('Réservation introuvable.');
    }
    return reservation;
  }
}
