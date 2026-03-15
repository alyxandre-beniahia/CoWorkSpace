import {
  BadRequestAuthError,
  UserNotFoundError,
  InvalidCredentialsError,
} from '../../domain/errors/auth.errors';
import type { IUserRepository } from '../../domain/repositories/user.repository.interface';
import type { IPasswordHasher } from '../ports/password-hasher.port';
import type { ChangePasswordDto } from '../dtos/change-password.dto';

export class ChangePasswordUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
  ) {}

  /** Change le mot de passe de l'utilisateur connecté (page profil). */
  async run(userId: string, dto: ChangePasswordDto): Promise<{ message: string }> {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestAuthError(
        'Le nouveau mot de passe et la confirmation ne correspondent pas.',
      );
    }

    const user = await this.userRepo.findByIdWithPassword(userId);
    if (!user) {
      throw new UserNotFoundError('Utilisateur non trouvé');
    }

    const isCurrentValid = await this.passwordHasher.compare(
      dto.currentPassword,
      user.passwordHash,
    );
    if (!isCurrentValid) {
      throw new InvalidCredentialsError('Mot de passe actuel incorrect');
    }

    const passwordHash = await this.passwordHasher.hash(dto.newPassword);
    await this.userRepo.updatePassword(userId, passwordHash);

    return { message: 'Mot de passe mis à jour' };
  }
}
