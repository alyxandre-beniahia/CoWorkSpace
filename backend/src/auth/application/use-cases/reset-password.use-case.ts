import { Injectable, Inject } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import {
  BadRequestAuthError,
  InvalidOrExpiredTokenError,
} from '../../domain/errors/auth.errors';
import type { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { AUTH_USER_REPOSITORY } from '../../domain/repositories/user.repository.interface';
import type { ResetPasswordDto } from '../dtos/reset-password.dto';

type ResetPasswordResult = {
  message: string;
};

@Injectable()
export class ResetPasswordUseCase {
  constructor(
    @Inject(AUTH_USER_REPOSITORY)
    private readonly userRepo: IUserRepository,
  ) {}

  /** Réinitialise le mot de passe avec le token reçu par email (lien « mot de passe oublié »). */
  async run(dto: ResetPasswordDto): Promise<ResetPasswordResult> {
    if (!dto.token) {
      throw new BadRequestAuthError('Token manquant');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const consumed = await this.userRepo.findAndConsumePasswordResetToken(
      dto.token,
      passwordHash,
    );

    if (!consumed) {
      throw new InvalidOrExpiredTokenError('Lien invalide ou expiré');
    }

    return {
      message: 'Mot de passe mis à jour. Vous pouvez maintenant vous connecter.',
    };
  }
}
