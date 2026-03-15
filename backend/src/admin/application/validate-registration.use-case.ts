import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { EmailService } from '../../notification/infrastructure/email.service';

type ValidateRegistrationResult = { message: string };

/** Valide une inscription en attente : approvedAt, approvedById, isActive = true. Notifie le membre (US-ADM-01). */
@Injectable()
export class ValidateRegistrationUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  async run(userId: string, adminUserId: string): Promise<ValidateRegistrationResult> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    if (user.role.slug !== 'member') throw new ForbiddenException('Seuls les membres en attente peuvent être validés');
    if (user.approvedAt) throw new ForbiddenException('Cette inscription est déjà validée');
    if (!user.emailVerifiedAt) throw new ForbiddenException("L'email n'est pas encore vérifié");

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        approvedAt: new Date(),
        approvedById: adminUserId,
        isActive: true,
      },
    });

    await this.emailService.sendRegistrationApprovedEmail(user.email);

    return { message: 'Inscription validée. Le membre peut maintenant se connecter.' };
  }
}
