/**
 * Port pour le hash et la vérification des mots de passe.
 * Implémenté en infrastructure (ex. bcrypt). L'application ne dépend que de cette interface.
 */

export interface IPasswordHasher {
  hash(plainPassword: string): Promise<string>;
  compare(plainPassword: string, hash: string): Promise<boolean>;
}

/** Token d'injection pour l'implémentation (utilisé par le module Nest). */
export const AUTH_PASSWORD_HASHER = 'IPasswordHasher';
