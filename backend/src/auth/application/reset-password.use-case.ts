import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import type { ResetPasswordDto } from '../dto/reset-password.dto';

type ResetPasswordResult = {
  message: string;
};

@Injectable()
export class ResetPasswordUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async run(dto: ResetPasswordDto): Promise<ResetPasswordResult> {
    if (!dto.token) {
      throw new BadRequestException('Token manquant');
    }

    const userToken = await this.prisma.userToken.findFirst({
      where: {
        type: 'PASSWORD_RESET',
        token: dto.token,
        deletedAt: null,
      },
      include: { user: true },
    });

    if (!userToken || !userToken.user) {
      throw new NotFoundException('Lien invalide ou expiré');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userToken.userId },
        data: { password: passwordHash },
      }),
      this.prisma.userToken.update({
        where: { id: userToken.id },
        data: { deletedAt: new Date() },
      }),
    ]);

    return { message: 'Mot de passe mis à jour. Vous pouvez maintenant vous connecter.' };
  }
}

