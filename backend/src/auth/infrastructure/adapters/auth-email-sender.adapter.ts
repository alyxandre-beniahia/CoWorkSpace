import { Injectable } from '@nestjs/common';
import { EmailService } from '../../../notification/infrastructure/email.service';
import type { IEmailSender } from '../../application/ports/email-sender.port';

/**
 * Adapter qui délègue l'envoi d'emails au EmailService du module notification.
 * Permet à l'application (auth) de ne dépendre que du port IEmailSender.
 */
@Injectable()
export class AuthEmailSenderAdapter implements IEmailSender {
  constructor(private readonly emailService: EmailService) {}

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    await this.emailService.sendVerificationEmail(email, token);
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    await this.emailService.sendPasswordResetEmail(email, token);
  }
}
