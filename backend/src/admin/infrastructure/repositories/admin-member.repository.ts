import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import type { IAdminMemberRepository } from '../../domain/repositories/admin-member.repository.interface';
import type { ListMembersFilter } from '../../domain/entities/admin-member.entity';
import {
  AdminNotFoundError,
  AdminForbiddenError,
} from '../../domain/errors/admin.errors';

@Injectable()
export class AdminMemberRepository implements IAdminMemberRepository {
  constructor(private readonly prisma: PrismaService) {}

  async list(filter: ListMembersFilter) {
    const memberRole = await this.prisma.role.findUnique({ where: { slug: 'member' } });
    if (!memberRole) return [];

    const where: Prisma.UserWhereInput = { roleId: memberRole.id };
    if (filter === 'pending') {
      where.emailVerifiedAt = { not: null };
      where.approvedAt = null;
    } else if (filter === 'members') {
      where.approvedAt = { not: null };
    }

    const users = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstname: true,
        lastname: true,
        isActive: true,
        emailVerifiedAt: true,
        approvedAt: true,
        role: { select: { slug: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return users as unknown as Awaited<ReturnType<IAdminMemberRepository['list']>>;
  }

  async validateRegistration(userId: string, adminUserId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });
    if (!user) throw new AdminNotFoundError('Utilisateur introuvable');
    if (user.role.slug !== 'member')
      throw new AdminForbiddenError('Seuls les membres en attente peuvent être validés');
    if (user.approvedAt)
      throw new AdminForbiddenError('Cette inscription est déjà validée');
    if (!user.emailVerifiedAt)
      throw new AdminForbiddenError("L'email n'est pas encore vérifié");

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        approvedAt: new Date(),
        approvedById: adminUserId,
        isActive: true,
      },
    });
    return { message: 'Inscription validée. Le membre peut maintenant se connecter.' };
  }

  async rejectRegistration(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });
    if (!user) throw new AdminNotFoundError('Utilisateur introuvable');
    if (user.role.slug !== 'member')
      throw new AdminForbiddenError('Seuls les membres en attente peuvent être refusés');
    if (user.approvedAt)
      throw new AdminForbiddenError('Cette inscription est déjà validée');

    return { message: 'Inscription refusée.' };
  }

  async setMemberActive(userId: string, isActive: boolean) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });
    if (!user) throw new AdminNotFoundError('Utilisateur introuvable');
    if (user.role.slug !== 'member')
      throw new AdminForbiddenError('Seuls les membres peuvent être activés/désactivés');

    await this.prisma.user.update({
      where: { id: userId },
      data: { isActive },
    });
    return { isActive };
  }
}
