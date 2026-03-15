/**
 * Centralisation des routes du module space (paths et préfixe).
 */
export const SPACE_PREFIX = 'spaces';

export const SPACE_ROUTES = {
  LIST: '',
  BY_ID: ':id',
  SEATS: ':id/seats',
  EQUIPMENTS: 'equipments',
} as const;
