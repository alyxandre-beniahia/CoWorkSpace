/**
 * Types métier du domaine space (alignés sur le schéma BDD mais sans dépendance à Prisma).
 */

export const SPACE_TYPE = {
  MEETING_ROOM: 'MEETING_ROOM',
  HOT_DESK: 'HOT_DESK',
  OPEN_SPACE: 'OPEN_SPACE',
  OTHER: 'OTHER',
} as const;

export type SpaceType = (typeof SPACE_TYPE)[keyof typeof SPACE_TYPE];

export const SPACE_STATUS = {
  AVAILABLE: 'AVAILABLE',
  MAINTENANCE: 'MAINTENANCE',
  OCCUPIED: 'OCCUPIED',
} as const;

export type SpaceStatus = (typeof SPACE_STATUS)[keyof typeof SPACE_STATUS];
