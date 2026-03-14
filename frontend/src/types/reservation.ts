/** Élément réservation tel que retourné par GET /reservations (liste / calendrier). */
export type ReservationCalendarItem = {
  id: string;
  spaceId: string;
  userId: string;
  startDatetime: string;
  endDatetime: string;
  isPrivate: boolean;
  title: string | null;
  effectiveTitle: string | null;
  isOwner: boolean;
};

/** Payload pour POST /reservations (création). */
export type CreateReservationBody = {
  spaceId: string;
  startDatetime: string;
  endDatetime: string;
  title?: string | null;
  isPrivate?: boolean;
  recurrenceRule?: string | null;
  recurrenceEndAt?: string | null;
  /** Fuseau IANA pour récurrence (même heure locale, ex. Europe/Paris). */
  timeZone?: string | null;
};

/** Payload pour PATCH /reservations/:id (modification). */
export type UpdateReservationBody = {
  startDatetime?: string;
  endDatetime?: string;
  title?: string | null;
  isPrivate?: boolean;
  recurrenceRule?: string | null;
  recurrenceEndAt?: string | null;
};

/** Props étendues des événements FullCalendar pour les réservations (lecture). */
export type ReservationEventExtendedProps = {
  reservationId?: string;
  isOwner?: boolean;
  canEdit?: boolean;
};
