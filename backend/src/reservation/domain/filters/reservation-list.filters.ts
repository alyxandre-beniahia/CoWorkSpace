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
  /** Pour l’affichage calendrier : ne pas masquer le titre des réservations privées. */
  unmaskTitlesForCalendar?: boolean;
};
