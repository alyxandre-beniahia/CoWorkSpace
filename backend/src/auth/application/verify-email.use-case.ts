import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

type VerifyEmailResult = {
  message: string;
};

@Injectable()
export class VerifyEmailUseCase {
  constructor(private readonly prisma: PrismaService) {}

  /** Marque l’email comme vérifié et active le compte (lien cliqué dans l’email). */
  async run(token: string): Promise<VerifyEmailResult> {
    if (!token || typeof token !== 'string') {
      throw new BadRequestException('Token manquant');
    }

    const tokenTrimmed = token.trim();

    const userToken = await this.prisma.userToken.findFirst({
      where: {
        type: 'EMAIL_VERIFICATION',
        token: tokenTrimmed,
        deletedAt: null,
      },
      include: { user: true },
    });

    if (userToken?.user) {
      await this.prisma.$transaction([
        this.prisma.user.update({
          where: { id: userToken.userId },
          data: {
            emailVerifiedAt: userToken.user.emailVerifiedAt ?? new Date(),
            // isActive reste false : validation par l'admin (admin/membres)
          },
        }),
        this.prisma.userToken.update({
          where: { id: userToken.id },
          data: { deletedAt: new Date() },
        }),
      ]);
      return { message: 'Email vérifié. Votre inscription est en attente de validation par un administrateur.' };
    }

    const alreadyUsedToken = await this.prisma.userToken.findFirst({
      where: { type: 'EMAIL_VERIFICATION', token: tokenTrimmed },
      include: { user: true },
    });
    if (alreadyUsedToken?.user?.emailVerifiedAt) {
      return { message: 'Votre email est déjà vérifié. Votre inscription est en attente de validation par un administrateur.' };
    }

    throw new NotFoundException('Lien invalide ou expiré');
  }
}

