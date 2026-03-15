import {
  BadRequestAuthError,
  InvalidOrExpiredTokenError,
} from '../../domain/errors/auth.errors';
import type { IUserRepository } from '../../domain/repositories/user.repository.interface';
import type { IPasswordHasher } from '../ports/password-hasher.port';
import type { ResetPasswordDto } from '../dtos/reset-password.dto';

type ResetPasswordResult = {
  message: string;
};

export class ResetPasswordUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
  ) {}

  /** Réinitialise le mot de passe avec le token reçu par email (lien « mot de passe oublié »). */
  async run(dto: ResetPasswordDto): Promise<ResetPasswordResult> {
    if (!dto.token) {
      throw new BadRequestAuthError('Token manquant');
    }

    const passwordHash = await this.passwordHasher.hash(dto.password);
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
