import { UserNotFoundError } from '../../domain/errors/auth.errors';
import type { IUserRepository } from '../../domain/repositories/user.repository.interface';
import type { IAvatarUrlProvider } from '../ports/avatar-url.port';
import type { MeResult } from '../../domain/entities/user.entity';

/** Retourne le profil de l'utilisateur connecté (pour affichage et formulaire profil). */
export class GetMeUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
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
