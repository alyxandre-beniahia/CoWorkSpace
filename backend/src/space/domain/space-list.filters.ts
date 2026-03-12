import { SpaceStatus, SpaceType } from '@prisma/client';

export type SpaceListFilters = {
  type?: SpaceType;
  equipementId?: string;
  capacityMin?: number;
  capacityMax?: number;
};
