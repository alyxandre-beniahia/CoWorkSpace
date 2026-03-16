/**
 * Types de notification pour le log (alignés sur l'enum Prisma NotificationType + extensions).
 * Le domain ne dépend pas de Prisma ; l'infrastructure mappera vers l'enum Prisma.
 */
export type NotificationLogType =
  | 'SIGNUP_CONFIRMATION'
  | 'REGISTRATION_APPROVED'
  | 'REGISTRATION_REJECTED'
  | 'RESERVATION_CONFIRMATION'
  | 'RESERVATION_REMINDER_24H'
  | 'RESERVATION_CANCELLED'
  | 'RESERVATION_MODIFIED';

export interface CreateNotificationLogInput {
  type: NotificationLogType;
  userId: string;
  reservationId?: string | null;
}

export const NOTIFICATION_LOG_REPOSITORY = 'INotificationLogRepository';

export interface INotificationLogRepository {
  create(data: CreateNotificationLogInput): Promise<void>;
}
