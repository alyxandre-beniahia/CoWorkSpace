/**
 * Erreurs métier du domaine admin. L'infrastructure les mappe vers les codes HTTP.
 */

export const ADMIN_ERROR_CODES = {
  NOT_FOUND: 'ADMIN_NOT_FOUND',
  FORBIDDEN: 'ADMIN_FORBIDDEN',
  CONFLICT: 'ADMIN_CONFLICT',
} as const;

export class AdminNotFoundError extends Error {
  readonly code = ADMIN_ERROR_CODES.NOT_FOUND;
  constructor(message = 'Ressource introuvable.') {
    super(message);
    this.name = 'AdminNotFoundError';
    Object.setPrototypeOf(this, AdminNotFoundError.prototype);
  }
}

export class AdminForbiddenError extends Error {
  readonly code = ADMIN_ERROR_CODES.FORBIDDEN;
  constructor(message: string) {
    super(message);
    this.name = 'AdminForbiddenError';
    Object.setPrototypeOf(this, AdminForbiddenError.prototype);
  }
}

export class AdminConflictError extends Error {
  readonly code = ADMIN_ERROR_CODES.CONFLICT;
  constructor(message: string) {
    super(message);
    this.name = 'AdminConflictError';
    Object.setPrototypeOf(this, AdminConflictError.prototype);
  }
}

export type AdminDomainError =
  | AdminNotFoundError
  | AdminForbiddenError
  | AdminConflictError;

export function isAdminDomainError(err: unknown): err is AdminDomainError {
  return (
    err instanceof Error &&
    'code' in err &&
    typeof (err as AdminDomainError).code === 'string' &&
    (err as AdminDomainError).code.startsWith('ADMIN_')
  );
}
