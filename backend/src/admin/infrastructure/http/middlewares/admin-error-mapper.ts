import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  ADMIN_ERROR_CODES,
  isAdminDomainError,
  type AdminDomainError,
} from '../../../domain/errors/admin.errors';

export function mapAdminDomainErrorToHttp(err: unknown): never {
  if (!isAdminDomainError(err)) {
    if (err instanceof Error) {
      throw err;
    }
    throw new BadRequestException('Une erreur est survenue');
  }

  const adminErr = err as AdminDomainError;
  const message = adminErr.message;
  switch (adminErr.code) {
    case ADMIN_ERROR_CODES.NOT_FOUND:
      throw new NotFoundException(message);
    case ADMIN_ERROR_CODES.FORBIDDEN:
      throw new ForbiddenException(message);
    case ADMIN_ERROR_CODES.CONFLICT:
      throw new ConflictException(message);
    default:
      throw new BadRequestException(message);
  }
}
