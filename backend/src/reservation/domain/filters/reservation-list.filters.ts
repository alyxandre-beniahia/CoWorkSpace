/**
 * Filtres pour la liste des réservations. Types purs, sans dépendance à Prisma.
 */

export type ReservationListFilters = {
  userId?: string;
  spaceId?: string;
  from?: Date;
  to?: Date;
  currentUserId?: string;
  role?: string;
};
