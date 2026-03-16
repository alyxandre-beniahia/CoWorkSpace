import type { ReservationNotificationPayload } from '../../domain/entities/reservation-notification.payload';

/**
 * Port interne : envoi effectif des emails (implémenté en infrastructure via EmailService).
 * Les use cases dépendent de ce port, pas de Resend directement.
 */
export const NOTIFICATION_EMAIL_SENDER = 'INotificationEmailSender';

export interface INotificationEmailSender {
  sendRegistrationApproved(to: string): Promise<void>;
  sendRegistrationRejected(to: string): Promise<void>;
  sendReservationConfirmation(to: string, payload: ReservationNotificationPayload): Promise<void>;
  sendReservationReminder24h(to: string, payload: ReservationNotificationPayload): Promise<void>;
  sendReservationCancelled(to: string, payload: ReservationNotificationPayload): Promise<void>;
  sendReservationModified(to: string, payload: ReservationNotificationPayload): Promise<void>;
}
