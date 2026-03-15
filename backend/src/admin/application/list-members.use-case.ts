import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

export type MemberListItem = {
  id: string;
  email: string;
  firstname: string;
  lastname: string;
  isActive: boolean;
  emailVerifiedAt: Date | null;
  approvedAt: Date | null;
  role: { slug: string };
};

export type ListMembersFilter = 'pending' | 'members' | 'all';

/** Liste les users avec rôle member. pending = email vérifié mais pas encore approuvé par l'admin. */
@Injectable()
export class ListMembersUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async run(filter: ListMembersFilter): Promise<MemberListItem[]> {
    const memberRole = await this.prisma.role.findUnique({ where: { slug: 'member' } });
    if (!memberRole) return [];

    const where: Prisma.UserWhereInput = {
      roleId: memberRole.id,
    };

    if (filter === 'pending') {
      where.emailVerifiedAt = { not: null };
      where.approvedAt = null;
    } else if (filter === 'members') {
      where.approvedAt = { not: null };
    }
    // 'all' : pas de filtre supplémentaire

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

    return users as unknown as MemberListItem[];
  }
}
