/**
 * Filtres pour la liste des réservations.
 * Types purs, sans dépendance à Prisma.
 */

export type ReservationListFilters = {
  userId?: string;
  spaceId?: string;
  from?: Date;
  to?: Date;
  /** Pour masquer les détails des réservations privées dont l'utilisateur n'est pas propriétaire */
  currentUserId?: string;
  /** Si 'admin', ne pas masquer les réservations privées (voir tous les détails). */
  role?: string;
};
