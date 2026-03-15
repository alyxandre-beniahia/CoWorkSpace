/**
 * Port pour la résolution d'URL d'avatar (ex. service externe DiceBear).
 * Implémenté en infrastructure. L'application ne dépend que de cette interface.
 */

export interface IAvatarUrlProvider {
  getAvatarUrl(userId: string): string;
}

/** Token d'injection pour l'implémentation (utilisé par le module Nest). */
export const AUTH_AVATAR_URL_PROVIDER = 'IAvatarUrlProvider';
