/**
 * Erreurs métier du domaine reservation. Aucune dépendance à Nest ou Prisma.
 * L'infrastructure les mappe vers les codes HTTP appropriés.
 */

export const RESERVATION_ERROR_CODES = {
  NOT_FOUND: 'RESERVATION_NOT_FOUND',
  FORBIDDEN: 'RESERVATION_FORBIDDEN',
  CONFLICT: 'RESERVATION_CONFLICT',
  BAD_REQUEST: 'RESERVATION_BAD_REQUEST',
} as const;

export class ReservationNotFoundError extends Error {
  readonly code = RESERVATION_ERROR_CODES.NOT_FOUND;
  constructor(message = 'Réservation introuvable.') {
    super(message);
    this.name = 'ReservationNotFoundError';
    Object.setPrototypeOf(this, ReservationNotFoundError.prototype);
  }
}

export class ReservationForbiddenError extends Error {
  readonly code = RESERVATION_ERROR_CODES.FORBIDDEN;
  constructor(message: string) {
    super(message);
    this.name = 'ReservationForbiddenError';
    Object.setPrototypeOf(this, ReservationForbiddenError.prototype);
  }
}

export class ReservationConflictError extends Error {
  readonly code = RESERVATION_ERROR_CODES.CONFLICT;
  constructor(message: string) {
    super(message);
    this.name = 'ReservationConflictError';
    Object.setPrototypeOf(this, ReservationConflictError.prototype);
  }
}

export class ReservationBadRequestError extends Error {
  readonly code = RESERVATION_ERROR_CODES.BAD_REQUEST;
  constructor(message: string) {
    super(message);
    this.name = 'ReservationBadRequestError';
    Object.setPrototypeOf(this, ReservationBadRequestError.prototype);
  }
}

export type ReservationDomainError =
  | ReservationNotFoundError
  | ReservationForbiddenError
  | ReservationConflictError
  | ReservationBadRequestError;

export function isReservationDomainError(err: unknown): err is ReservationDomainError {
  return (
    err instanceof Error &&
    'code' in err &&
    typeof (err as ReservationDomainError).code === 'string' &&
    (err as ReservationDomainError).code.startsWith('RESERVATION_')
  );
}
