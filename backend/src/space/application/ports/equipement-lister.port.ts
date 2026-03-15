/**
 * Port pour la liste des équipements (lecture seule).
 * Implémenté en infrastructure. L'application ne dépend que de cette interface.
 */

export type EquipementItem = { id: string; name: string };

export interface IEquipementLister {
  list(): Promise<EquipementItem[]>;
}

/** Token d'injection pour l'implémentation (utilisé par le module Nest). */
export const SPACE_EQUIPEMENT_LISTER = 'IEquipementLister';
