import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

type VerifyEmailResult = {
  message: string;
};

@Injectable()
export class VerifyEmailUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async run(token: string): Promise<VerifyEmailResult> {
    if (!token) {
      throw new BadRequestException('Token manquant');
    }

    const userToken = await this.prisma.userToken.findFirst({
      where: {
        type: 'EMAIL_VERIFICATION',
        token,
        deletedAt: null,
      },
      include: { user: true },
    });

    if (!userToken || !userToken.user) {
      throw new NotFoundException('Lien invalide ou expiré');
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userToken.userId },
        data: {
          emailVerifiedAt: userToken.user.emailVerifiedAt ?? new Date(),
          isActive: true,
        },
      }),
      this.prisma.userToken.update({
        where: { id: userToken.id },
        data: { deletedAt: new Date() },
      }),
    ]);

    return { message: 'Email vérifié. Vous pouvez maintenant vous connecter.' };
  }
}

