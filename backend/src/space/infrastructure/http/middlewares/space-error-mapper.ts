import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SPACE_ERROR_CODES, isSpaceDomainError, type SpaceDomainError } from '../../../domain/errors/space.errors';

/**
 * Map les erreurs métier du domaine space vers les exceptions HTTP Nest.
 * Utilisé dans la couche HTTP (contrôleur).
 */
export function mapSpaceDomainErrorToHttp(err: unknown): never {
  if (!isSpaceDomainError(err)) {
    if (err instanceof Error) {
      throw err;
    }
    throw new BadRequestException('Une erreur est survenue');
  }

  const spaceErr = err as SpaceDomainError;
  const message = spaceErr.message;
  switch (spaceErr.code) {
    case SPACE_ERROR_CODES.SPACE_NOT_FOUND:
      throw new NotFoundException(message);
    default:
      throw new BadRequestException(message);
  }
}
