/**
 * Types métier pour le dashboard admin. Aucune dépendance externe.
 */

export type TopSpaceReserved = {
  spaceId: string;
  spaceName: string;
  count: number;
};

export type DashboardStats = {
  reservationsToday: number;
  reservationsWeek: number;
  occupancyRateWeek: number;
  activeUsersCount: number;
  topSpacesReserved: TopSpaceReserved[];
  cancelledReservationsWeek: number;
};

export type ActivityItem = {
  id: string;
  createdAt: Date;
  action: string;
  userName: string;
  spaceName: string | null;
  reservationStart: Date | null;
  reservationEnd: Date | null;
};
