import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  RESERVATION_ERROR_CODES,
  isReservationDomainError,
  type ReservationDomainError,
} from '../../../domain/errors/reservation.errors';

/**
 * Map les erreurs métier du domaine reservation vers les exceptions HTTP Nest.
 */
export function mapReservationDomainErrorToHttp(err: unknown): never {
  if (!isReservationDomainError(err)) {
    if (err instanceof Error) {
      throw err;
    }
    throw new BadRequestException('Une erreur est survenue');
  }

  const reservationErr = err as ReservationDomainError;
  const message = reservationErr.message;
  switch (reservationErr.code) {
    case RESERVATION_ERROR_CODES.NOT_FOUND:
      throw new NotFoundException(message);
    case RESERVATION_ERROR_CODES.FORBIDDEN:
      throw new ForbiddenException(message);
    case RESERVATION_ERROR_CODES.CONFLICT:
      throw new ConflictException(message);
    case RESERVATION_ERROR_CODES.BAD_REQUEST:
      throw new BadRequestException(message);
    default:
      throw new BadRequestException(message);
  }
}
