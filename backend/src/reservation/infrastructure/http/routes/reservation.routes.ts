/**
 * Centralisation des routes du module reservation (paths et préfixe).
 */
export const RESERVATION_PREFIX = 'reservations';

export const RESERVATION_ROUTES = {
  LIST: '',
  BY_ID: ':id',
  CANCEL: ':id/annuler',
  CALENDAR: 'calendar',
} as const;
