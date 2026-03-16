/**
 * Payload métier pour les emails de réservation (confirmation, rappel, annulation, modification).
 * Défini dans le domain notification pour que les autres modules ne dépendent que de ce contrat.
 */
export type ReservationNotificationPayload = {
  userId: string;
  userEmail: string;
  reservationId: string;
  spaceName: string;
  startDatetime: Date;
  endDatetime: Date;
  title?: string | null;
};
