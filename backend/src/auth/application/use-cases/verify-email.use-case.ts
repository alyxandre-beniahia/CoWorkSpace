import { Injectable, Inject } from '@nestjs/common';
import {
  BadRequestAuthError,
  InvalidOrExpiredTokenError,
} from '../../domain/errors/auth.errors';
import type { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { AUTH_USER_REPOSITORY } from '../../domain/repositories/user.repository.interface';

type VerifyEmailResult = {
  message: string;
};

@Injectable()
export class VerifyEmailUseCase {
  constructor(
    @Inject(AUTH_USER_REPOSITORY)
    private readonly userRepo: IUserRepository,
  ) {}

  /** Marque l'email comme vérifié (lien cliqué dans l'email). */
  async run(token: string): Promise<VerifyEmailResult> {
    if (!token || typeof token !== 'string') {
      throw new BadRequestAuthError('Token manquant');
    }

    const result = await this.userRepo.findAndConsumeEmailVerificationToken(token);

    if (result === null) {
      throw new InvalidOrExpiredTokenError('Lien invalide ou expiré');
    }
    if ('alreadyVerified' in result) {
      return {
        message:
          'Votre email est déjà vérifié. Votre inscription est en attente de validation par un administrateur.',
      };
    }
    return {
      message:
        'Email vérifié. Votre inscription est en attente de validation par un administrateur.',
    };
  }
}
