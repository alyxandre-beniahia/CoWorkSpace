/**
 * Port pour les plages calendaires (fuseau Paris) utilisées par le dashboard admin.
 * Implémenté en infrastructure (sans dépendance des use cases à Intl / utils réservation).
 */

export type ParisDateRange = { start: Date; end: Date };

export interface IAdminDashboardTimeRanges {
  todayParis(): ParisDateRange;
  weekParis(): ParisDateRange;
}

export const ADMIN_DASHBOARD_TIME_RANGES = 'IAdminDashboardTimeRanges';
