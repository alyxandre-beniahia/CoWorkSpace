/**
 * Types métier pour les équipements (admin). Aucune dépendance externe.
 */

export type EquipementListItem = {
  id: string;
  name: string;
  quantity: number;
  assigned?: number;
  available?: number;
};

export type EquipementAvailability = {
  total: number;
  assigned: number;
  available: number;
};

export type CreateEquipementInput = {
  name: string;
  quantity?: number;
};

export type UpdateEquipementInput = {
  name?: string;
  quantity?: number;
};
