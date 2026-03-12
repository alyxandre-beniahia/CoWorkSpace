import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../../notification/infrastructure/email.service';
import { randomBytes } from 'crypto';
import type { RequestPasswordResetDto } from '../dto/request-password-reset.dto';

type RequestPasswordResetResult = {
  message: string;
};

@Injectable()
export class RequestPasswordResetUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  /** Demande de réinitialisation : crée un token et prépare l’envoi d’email (module notification). */
  async run(dto: RequestPasswordResetDto): Promise<RequestPasswordResetResult> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true },
    });

    if (!user) {
      // Réponse générique pour éviter l'énumération d'emails
      return {
        message:
          'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.',
      };
    }

    const token = randomBytes(32).toString('hex');

    await this.prisma.userToken.create({
      data: {
        type: 'PASSWORD_RESET',
        token,
        userId: user.id,
      },
    });

    // L’envoi d’email sera géré par le module notification ou une integration externe.
    try {
      await this.emailService.sendPasswordResetEmail(dto.email, token);
    } catch (err) {
      console.error('[RequestPasswordResetUseCase] Envoi email reset MDP échoué:', err);
    }

    return {
      message:
        'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.',
    };
  }
}

