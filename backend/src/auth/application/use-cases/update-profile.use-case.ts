import { Injectable, Inject } from '@nestjs/common';
import { UserNotFoundError } from '../../domain/errors/auth.errors';
import type { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { AUTH_USER_REPOSITORY } from '../../domain/repositories/user.repository.interface';
import type { IAvatarUrlProvider } from '../ports/avatar-url.port';
import { AUTH_AVATAR_URL_PROVIDER } from '../ports/avatar-url.port';
import type { MeResult } from '../../domain/entities/user.entity';
import type { UpdateProfileDto } from '../dtos/update-profile.dto';

@Injectable()
export class UpdateProfileUseCase {
  constructor(
    @Inject(AUTH_USER_REPOSITORY)
    private readonly userRepo: IUserRepository,
    @Inject(AUTH_AVATAR_URL_PROVIDER)
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
