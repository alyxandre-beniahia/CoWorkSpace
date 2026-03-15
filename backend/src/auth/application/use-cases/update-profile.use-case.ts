import { UserNotFoundError } from '../../domain/errors/auth.errors';
import type { IUserRepository } from '../../domain/repositories/user.repository.interface';
import type { IAvatarUrlProvider } from '../ports/avatar-url.port';
import type { MeResult } from '../../domain/entities/user.entity';
import type { UpdateProfileDto } from '../dtos/update-profile.dto';

export class UpdateProfileUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly avatarUrlProvider: IAvatarUrlProvider,
  ) {}

  /** Met à jour prénom, nom et téléphone de l'utilisateur connecté. */
  async run(userId: string, dto: UpdateProfileDto): Promise<MeResult> {
    const existing = await this.userRepo.findById(userId);
    if (!existing) {
      throw new UserNotFoundError('Utilisateur non trouvé');
    }

    const updated = await this.userRepo.updateProfile(userId, {
      firstname: dto.firstname,
      lastname: dto.lastname,
      phone: dto.phone,
    });

    return {
      id: updated.id,
      email: updated.email,
      firstname: updated.firstname,
      lastname: updated.lastname,
      phone: updated.phone,
      avatarUrl: updated.avatarUrl ?? this.avatarUrlProvider.getAvatarUrl(updated.id),
      role: updated.role,
    };
  }
}
