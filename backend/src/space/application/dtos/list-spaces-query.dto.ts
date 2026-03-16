import type { SpaceType } from '../../domain/entities/space-types';

/** Paramètres de requête pour la liste des espaces (query string HTTP). */
export type ListSpacesQueryDto = {
  type?: SpaceType;
  name?: string;
  equipementId?: string;
  capacityMin?: string;
  capacityMax?: string;
};
