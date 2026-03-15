import type { SpaceType } from '../entities/space-types';

export type SpaceListFilters = {
  type?: SpaceType;
  equipementId?: string;
  capacityMin?: number;
  capacityMax?: number;
};
