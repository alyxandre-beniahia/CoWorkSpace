import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

/** Bascule le statut actif/inactif d'un membre (déjà approuvé). */
@Injectable()
export class SetMemberActiveUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async run(userId: string, isActive: boolean): Promise<{ isActive: boolean }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    if (user.role.slug !== 'member') throw new ForbiddenException('Seuls les membres peuvent être activés/désactivés');

    await this.prisma.user.update({
      where: { id: userId },
      data: { isActive },
    });

    return { isActive };
  }
}
