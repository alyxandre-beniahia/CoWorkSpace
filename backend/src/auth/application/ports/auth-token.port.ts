/**
 * Port pour la génération de tokens d'authentification (JWT).
 * Implémenté en infrastructure. L'application ne dépend que de cette interface.
 */

export type AuthTokenPayload = {
  sub: string;
  email: string;
  role: string;
};

export interface IAuthTokenService {
  sign(payload: AuthTokenPayload): string;
}

/** Token d'injection pour l'implémentation (utilisé par le module Nest). */
export const AUTH_TOKEN_SERVICE = 'IAuthTokenService';
