import { Injectable, Inject } from '@nestjs/common';
import { UserNotFoundError } from '../../domain/errors/auth.errors';
import type { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { AUTH_USER_REPOSITORY } from '../../domain/repositories/user.repository.interface';
import type { IAvatarUrlProvider } from '../ports/avatar-url.port';
import { AUTH_AVATAR_URL_PROVIDER } from '../ports/avatar-url.port';
import type { MeResult } from '../../domain/entities/user.entity';

/** Retourne le profil de l'utilisateur connecté (pour affichage et formulaire profil). */
@Injectable()
export class GetMeUseCase {
  constructor(
    @Inject(AUTH_USER_REPOSITORY)
    private readonly userRepo: IUserRepository,
    @Inject(AUTH_AVATAR_URL_PROVIDER)
    private readonly avatarUrlProvider: IAvatarUrlProvider,
  ) {}

  async run(userId: string): Promise<MeResult> {
    const user = await this.userRepo.findById(userId);
    if (!user || !user.role) {
      throw new UserNotFoundError('Utilisateur non trouvé');
    }
    return {
      id: user.id,
      email: user.email,
      firstname: user.firstname,
      lastname: user.lastname,
      phone: user.phone,
      avatarUrl: user.avatarUrl ?? this.avatarUrlProvider.getAvatarUrl(user.id),
      role: user.role,
    };
  }
}
