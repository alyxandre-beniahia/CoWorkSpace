import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  AUTH_ERROR_CODES,
  isAuthDomainError,
  type AuthDomainError,
} from '../../../domain/errors/auth.errors';

/**
 * Map les erreurs métier du domaine auth vers les exceptions HTTP Nest.
 * Utilisé dans la couche HTTP (contrôleur).
 */
export function mapAuthDomainErrorToHttp(err: unknown): never {
  if (!isAuthDomainError(err)) {
    if (err instanceof Error) {
      throw err;
    }
    throw new BadRequestException('Une erreur est survenue');
  }

  const authErr = err as AuthDomainError;
  const message = authErr.message;
  switch (authErr.code) {
    case AUTH_ERROR_CODES.INVALID_CREDENTIALS:
      throw new UnauthorizedException(message);
    case AUTH_ERROR_CODES.USER_NOT_FOUND:
    case AUTH_ERROR_CODES.INVALID_OR_EXPIRED_TOKEN:
      throw new NotFoundException(message);
    case AUTH_ERROR_CODES.EMAIL_ALREADY_EXISTS:
    case AUTH_ERROR_CODES.BAD_REQUEST:
    case AUTH_ERROR_CODES.ROLE_MISSING:
      throw new BadRequestException(message);
    default:
      throw new BadRequestException(message);
  }
}
