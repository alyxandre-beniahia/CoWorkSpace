/**
 * Centralisation des préfixes et routes du module admin.
 */
export const ADMIN_PREFIX_MEMBRES = 'admin/membres';
export const ADMIN_PREFIX_ESPACES = 'admin/espaces';
export const ADMIN_PREFIX_EQUIPEMENTS = 'admin/equipements';
export const ADMIN_PREFIX_DASHBOARD = 'admin/dashboard';

export const ADMIN_ROUTES_MEMBRES = {
  LIST: '',
  VALIDATE: ':id/valider',
  REJECT: ':id/refuser',
  SET_ACTIVE: ':id/actif',
} as const;

export const ADMIN_ROUTES_ESPACES = {
  LIST: '',
  BY_ID: ':id',
  ATTACH_EQUIPEMENT: ':id/equipements',
  DETACH_EQUIPEMENT: ':id/equipements/:equipementId',
} as const;

export const ADMIN_ROUTES_EQUIPEMENTS = {
  LIST: '',
  BY_ID: ':id',
  AVAILABILITY: ':id/availability',
} as const;

export const ADMIN_ROUTES_DASHBOARD = {
  STATS: '',
  ACTIVITY: 'activity',
} as const;
