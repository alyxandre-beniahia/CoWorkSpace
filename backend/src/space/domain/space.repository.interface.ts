import type { SpaceListFilters } from './space-list.filters';

export type SpaceWithEquipements = {
  id: string;
  name: string;
  code: string | null;
  type: string;
  capacity: number;
  status: string;
  description: string | null;
  positionX: number | null;
  positionY: number | null;
  equipements: { name: string }[];
};

export type SpaceListItem = {
  id: string;
  name: string;
  code: string | null;
  type: string;
  capacity: number;
  status: string;
  equipements: string[];
};

export type SeatListItem = {
  id: string;
  spaceId: string;
  code: string;
  positionX: number | null;
  positionY: number | null;
};

export interface ISpaceRepository {
  list(filters: SpaceListFilters): Promise<SpaceListItem[]>;
  findById(id: string): Promise<SpaceWithEquipements | null>;
  findSeatsBySpaceId(spaceId: string): Promise<SeatListItem[]>;
}
