/**
 * Erreurs métier du domaine space. Aucune dépendance à Nest ou Prisma.
 * L'infrastructure les mappe vers les codes HTTP appropriés.
 */

export const SPACE_ERROR_CODES = {
  SPACE_NOT_FOUND: 'SPACE_NOT_FOUND',
} as const;

export class SpaceNotFoundError extends Error {
  readonly code = SPACE_ERROR_CODES.SPACE_NOT_FOUND;
  constructor(message = 'Espace non trouvé') {
    super(message);
    this.name = 'SpaceNotFoundError';
    Object.setPrototypeOf(this, SpaceNotFoundError.prototype);
  }
}

export type SpaceDomainError = SpaceNotFoundError;

export function isSpaceDomainError(err: unknown): err is SpaceDomainError {
  return err instanceof Error && 'code' in err && (err as SpaceDomainError).code === SPACE_ERROR_CODES.SPACE_NOT_FOUND;
}
