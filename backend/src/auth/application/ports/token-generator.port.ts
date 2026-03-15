/**
 * Port pour la génération de tokens aléatoires (ex. vérification email, reset mot de passe).
 * Implémenté en infrastructure. L'application ne dépend que de cette interface.
 */

export interface ITokenGenerator {
  generate(): string;
}

/** Token d'injection pour l'implémentation (utilisé par le module Nest). */
export const AUTH_TOKEN_GENERATOR = 'ITokenGenerator';
