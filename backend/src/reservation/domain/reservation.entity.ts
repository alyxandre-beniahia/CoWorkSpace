/**
 * Types métier pour les réservations.
 * Aucune dépendance externe (Prisma, Nest, etc.).
 */

export type ReservationListItem = {
  id: string;
  spaceId: string;
  spaceName: string;
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
};

export type CreateReservationInput = {
  spaceId: string;
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
  startDatetime?: Date;
  endDatetime?: Date;
  title?: string | null;
  isPrivate?: boolean;
  recurrenceRule?: string | null;
  recurrenceEndAt?: Date | null;
};
