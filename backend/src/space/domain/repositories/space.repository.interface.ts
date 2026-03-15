import type { SpaceListFilters } from '../filters/space-list.filters';
import type { SpaceWithEquipements, SpaceListItem, SeatListItem } from '../entities/space.entity';

/** Token d'injection pour l'implémentation du repository (utilisé par le module Nest). */
export const SPACE_REPOSITORY = 'ISpaceRepository';

export type { SpaceWithEquipements, SpaceListItem, SeatListItem };

export interface ISpaceRepository {
  list(filters: SpaceListFilters): Promise<SpaceListItem[]>;
  findById(id: string): Promise<SpaceWithEquipements | null>;
  findSeatsBySpaceId(spaceId: string): Promise<SeatListItem[]>;
}
