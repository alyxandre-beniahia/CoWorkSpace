import { Injectable, Inject } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import {
  BadRequestAuthError,
  UserNotFoundError,
  InvalidCredentialsError,
} from '../../domain/errors/auth.errors';
import type { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { AUTH_USER_REPOSITORY } from '../../domain/repositories/user.repository.interface';
import type { ChangePasswordDto } from '../dtos/change-password.dto';

@Injectable()
export class ChangePasswordUseCase {
  constructor(
    @Inject(AUTH_USER_REPOSITORY)
    private readonly userRepo: IUserRepository,
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

    const isCurrentValid = await bcrypt.compare(
      dto.currentPassword,
      user.passwordHash,
    );
    if (!isCurrentValid) {
      throw new InvalidCredentialsError('Mot de passe actuel incorrect');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.userRepo.updatePassword(userId, passwordHash);

    return { message: 'Mot de passe mis à jour' };
  }
}
