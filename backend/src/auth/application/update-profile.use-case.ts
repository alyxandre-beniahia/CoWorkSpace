import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { UpdateProfileDto } from '../dto/update-profile.dto';

@Injectable()
export class UpdateProfileUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async run(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        firstname: dto.firstname ?? user.firstname,
        lastname: dto.lastname ?? user.lastname,
        phone: dto.phone ?? user.phone,
      },
      select: {
        id: true,
        email: true,
        firstname: true,
        lastname: true,
        phone: true,
        role: { select: { slug: true } },
      },
    });

    return updated;
  }
}

