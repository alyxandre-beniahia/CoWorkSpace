/**
 * Types métier pour les réservations.
 * Aucune dépendance externe (Prisma, Nest, etc.).
 */

export type ReservationListItem = {
  id: string;
  spaceId: string;
  spaceName: string;
  seatId: string | null;
  seatCode: string | null;
  userId: string;
  startDatetime: Date;
  endDatetime: Date;
  title: string | null;
  isPrivate: boolean;
  recurrenceGroupId?: string | null;
  /** true si la réservation appartient à l'utilisateur connecté (currentUserId) */
  isOwner: boolean;
};

export type ReservationWithDetails = ReservationListItem & {
  userName: string;
  userEmail: string;
  recurrenceGroupId?: string | null;
  recurrenceRule?: string | null;
  recurrenceEndAt?: Date | null;
};

export type CreateReservationInput = {
  spaceId: string;
  seatId?: string | null;
  userId: string;
  startDatetime: Date;
  endDatetime: Date;
  title?: string | null;
  isPrivate?: boolean;
  recurrenceRule?: string | null;
  recurrenceEndAt?: Date | null;
  recurrenceGroupId?: string | null;
};

export type UpdateReservationInput = {
  seatId?: string | null;
  startDatetime?: Date;
  endDatetime?: Date;
  title?: string | null;
  isPrivate?: boolean;
  recurrenceRule?: string | null;
  recurrenceEndAt?: Date | null;
};
