/**
 * Centralisation des routes du module auth (paths et préfixe).
 */
export const AUTH_PREFIX = 'auth';

export const AUTH_ROUTES = {
  LOGIN: 'login',
  LOGOUT: 'logout',
  ME: 'me',
  REGISTER: 'register',
  VERIFY_EMAIL: 'verify-email',
  UPDATE_PROFILE: 'me',
  CHANGE_PASSWORD: 'change-password',
  FORGOT_PASSWORD: 'forgot-password',
  RESET_PASSWORD: 'reset-password',
} as const;
