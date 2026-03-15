/**
 * Types métier pour les espaces (admin). Aucune dépendance externe.
 */

export type AdminSpaceListItem = {
  id: string;
  name: string;
  code: string | null;
  type: string;
  capacity: number;
  status: string;
  description: string | null;
  positionX: number | null;
  positionY: number | null;
  equipements: { id: string; name: string; quantity: number }[];
};

export type CreateSpaceInput = {
  name: string;
  code?: string | null;
  type: string;
  capacity: number;
  description?: string | null;
  positionX?: number | null;
  positionY?: number | null;
};

export type UpdateSpaceInput = Partial<CreateSpaceInput> & {
  status?: string;
};
