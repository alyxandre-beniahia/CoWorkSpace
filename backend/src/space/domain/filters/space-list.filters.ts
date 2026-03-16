import type { SpaceType } from '../entities/space-types';

export type SpaceListFilters = {
  type?: SpaceType;
  name?: string;
  equipementId?: string;
  capacityMin?: number;
  capacityMax?: number;
};
