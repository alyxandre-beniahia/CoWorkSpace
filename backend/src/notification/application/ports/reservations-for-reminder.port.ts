import type { ReservationNotificationPayload } from '../../domain/entities/reservation-notification.payload';

/**
 * Port pour le rappel 24h : récupérer les réservations qui commencent dans une fenêtre.
 * Implémenté par le module reservation (adapter qui utilise le repository réservation).
 */
export const RESERVATIONS_FOR_REMINDER = 'IReservationsForReminder';

export interface IReservationsForReminder {
  findReservationsStartingBetween(
    start: Date,
    end: Date,
  ): Promise<ReservationNotificationPayload[]>;
}
