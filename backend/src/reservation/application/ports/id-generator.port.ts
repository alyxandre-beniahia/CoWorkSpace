/**
 * Port pour la génération d'identifiants uniques (ex. UUID).
 * Implémenté en infrastructure. L'application ne dépend que de cette interface.
 */

export interface IIdGenerator {
  generate(): string;
}

/** Token d'injection pour l'implémentation (utilisé par le module Nest). */
export const RESERVATION_ID_GENERATOR = 'IIdGenerator';
