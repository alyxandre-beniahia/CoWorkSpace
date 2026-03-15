/**
 * Erreurs métier du domaine auth. Aucune dépendance à Nest ou autre framework.
 * L'infrastructure les mappe vers les codes HTTP appropriés.
 */

export const AUTH_ERROR_CODES = {
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  EMAIL_ALREADY_EXISTS: 'EMAIL_ALREADY_EXISTS',
  INVALID_OR_EXPIRED_TOKEN: 'INVALID_OR_EXPIRED_TOKEN',
  BAD_REQUEST: 'BAD_REQUEST',
  ROLE_MISSING: 'ROLE_MISSING',
} as const;

export class InvalidCredentialsError extends Error {
  readonly code = AUTH_ERROR_CODES.INVALID_CREDENTIALS;
  constructor(message = 'Identifiants incorrects') {
    super(message);
    this.name = 'InvalidCredentialsError';
    Object.setPrototypeOf(this, InvalidCredentialsError.prototype);
  }
}

export class UserNotFoundError extends Error {
  readonly code = AUTH_ERROR_CODES.USER_NOT_FOUND;
  constructor(message = 'Utilisateur non trouvé') {
    super(message);
    this.name = 'UserNotFoundError';
    Object.setPrototypeOf(this, UserNotFoundError.prototype);
  }
}

export class EmailAlreadyExistsError extends Error {
  readonly code = AUTH_ERROR_CODES.EMAIL_ALREADY_EXISTS;
  constructor(message = 'Un compte existe déjà avec cet email') {
    super(message);
    this.name = 'EmailAlreadyExistsError';
    Object.setPrototypeOf(this, EmailAlreadyExistsError.prototype);
  }
}

export class InvalidOrExpiredTokenError extends Error {
  readonly code = AUTH_ERROR_CODES.INVALID_OR_EXPIRED_TOKEN;
  constructor(message = 'Lien invalide ou expiré') {
    super(message);
    this.name = 'InvalidOrExpiredTokenError';
    Object.setPrototypeOf(this, InvalidOrExpiredTokenError.prototype);
  }
}

export class BadRequestAuthError extends Error {
  readonly code = AUTH_ERROR_CODES.BAD_REQUEST;
  constructor(message: string) {
    super(message);
    this.name = 'BadRequestAuthError';
    Object.setPrototypeOf(this, BadRequestAuthError.prototype);
  }
}

export class RoleMissingError extends Error {
  readonly code = AUTH_ERROR_CODES.ROLE_MISSING;
  constructor(message = 'Rôle member manquant en base') {
    super(message);
    this.name = 'RoleMissingError';
    Object.setPrototypeOf(this, RoleMissingError.prototype);
  }
}

export type AuthDomainError =
  | InvalidCredentialsError
  | UserNotFoundError
  | EmailAlreadyExistsError
  | InvalidOrExpiredTokenError
  | BadRequestAuthError
  | RoleMissingError;

export function isAuthDomainError(err: unknown): err is AuthDomainError {
  return err instanceof Error && 'code' in err && typeof (err as AuthDomainError).code === 'string';
}
