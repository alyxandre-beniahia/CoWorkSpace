import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../../notification/infrastructure/email.service';

type RejectRegistrationResult = { message: string };

/** Refuse une inscription en attente : on laisse isActive à false. Notifie le membre (US-ADM-01). */
@Injectable()
export class RejectRegistrationUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  async run(userId: string): Promise<RejectRegistrationResult> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    if (user.role.slug !== 'member') throw new ForbiddenException('Seuls les membres en attente peuvent être refusés');
    if (user.approvedAt) throw new ForbiddenException('Cette inscription est déjà validée');

    await this.emailService.sendRegistrationRejectedEmail(user.email);

    return { message: 'Inscription refusée.' };
  }
}
