import type { ReservationNotificationPayload } from '../../domain/entities/reservation-notification.payload';

/**
 * Port principal exposé aux autres modules (admin, reservation).
 * Implémenté en infrastructure par NotificationSenderAdapter.
 */
export const NOTIFICATION_SENDER = 'INotificationSender';

export interface INotificationSender {
  sendRegistrationApproved(email: string, userId: string): Promise<void>;
  sendRegistrationRejected(email: string, userId: string): Promise<void>;
  sendReservationConfirmation(payload: ReservationNotificationPayload): Promise<void>;
  sendReservationReminder24h(payload: ReservationNotificationPayload): Promise<void>;
  sendReservationCancelled(payload: ReservationNotificationPayload): Promise<void>;
  sendReservationModified(payload: ReservationNotificationPayload): Promise<void>;
}
