/** Poste (siège) dans un espace (ex. openspace). */
export type SeatItem = {
  id: string;
  spaceId: string;
  code: string;
  positionX: number | null;
  positionY: number | null;
};

/** Élément réservation tel que retourné par GET /reservations (liste / calendrier). */
export type ReservationCalendarItem = {
  id: string;
  spaceId: string;
  seatId: string | null;
  seatCode: string | null;
  userId: string;
  startDatetime: string;
  endDatetime: string;
  isPrivate: boolean;
  title: string | null;
  effectiveTitle?: string | null;
  isOwner: boolean;
};

/** Détail d'une réservation (GET /reservations/:id), avec infos utilisateur. */
export type ReservationDetail = ReservationCalendarItem & {
  spaceName?: string;
  userName: string;
  userEmail: string;
  recurrenceGroupId?: string | null;
};

/** Payload pour POST /reservations (création). */
export type CreateReservationBody = {
  spaceId: string;
  seatId?: string | null;
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
  seatId?: string | null;
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
