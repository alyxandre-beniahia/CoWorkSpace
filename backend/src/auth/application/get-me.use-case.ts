import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export type MeResult = {
  id: string;
  email: string;
  firstname: string;
  lastname: string;
  role: { slug: string };
};

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
        role: { select: { slug: true } },
      },
    });
    if (!user || !user.role) {
      throw new NotFoundException('Utilisateur non trouvé');
    }
    return user as MeResult;
  }
}
