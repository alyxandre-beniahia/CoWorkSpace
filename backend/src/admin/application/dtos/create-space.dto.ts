/**
 * DTO HTTP pour la création d'espace (admin). Aligné sur le corps attendu par l'API.
 */
export type CreateSpaceDto = {
  name: string;
  code?: string | null;
  type: string;
  capacity: number;
  description?: string | null;
  positionX?: number | null;
  positionY?: number | null;
};
