import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { getDiceBearAvatarUrl } from './avatar.utils';

export type MeResult = {
  id: string;
  email: string;
  firstname: string;
  lastname: string;
  phone?: string | null;
  avatarUrl?: string | null;
  role: { slug: string };
};

/** Retourne le profil de l’utilisateur connecté (pour affichage et formulaire profil). */
@Injectable()
export class GetMeUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async run(userId: string): Promise<MeResult> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstname: true,
        lastname: true,
        phone: true,
        avatarUrl: true,
        role: { select: { slug: true } },
      },
    });
    if (!user || !user.role) {
      throw new NotFoundException('Utilisateur non trouvé');
    }
    return {
      ...user,
      avatarUrl: user.avatarUrl ?? getDiceBearAvatarUrl(user.id),
    } as MeResult;
  }
}
