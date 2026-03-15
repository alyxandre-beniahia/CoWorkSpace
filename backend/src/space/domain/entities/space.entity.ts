import type { SpaceType, SpaceStatus } from './space-types';

/**
 * Types métier du domaine space. Aucune dépendance à Prisma ou Nest.
 */

export type SpaceWithEquipements = {
  id: string;
  name: string;
  code: string | null;
  type: SpaceType;
  capacity: number;
  status: SpaceStatus;
  description: string | null;
  positionX: number | null;
  positionY: number | null;
  equipements: { name: string }[];
};

export type SpaceListItem = {
  id: string;
  name: string;
  code: string | null;
  type: SpaceType;
  capacity: number;
  status: SpaceStatus;
  positionX: number | null;
  positionY: number | null;
  equipements: string[];
};

export type SeatListItem = {
  id: string;
  spaceId: string;
  code: string;
  positionX: number | null;
  positionY: number | null;
};
