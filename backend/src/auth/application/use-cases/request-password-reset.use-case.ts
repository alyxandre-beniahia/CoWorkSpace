import { Injectable, Inject } from '@nestjs/common';
import { randomBytes } from 'crypto';
import type { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { AUTH_USER_REPOSITORY } from '../../domain/repositories/user.repository.interface';
import type { IEmailSender } from '../ports/email-sender.port';
import { AUTH_EMAIL_SENDER } from '../ports/email-sender.port';
import type { RequestPasswordResetDto } from '../dtos/request-password-reset.dto';

type RequestPasswordResetResult = {
  message: string;
};

@Injectable()
export class RequestPasswordResetUseCase {
  constructor(
    @Inject(AUTH_USER_REPOSITORY)
    private readonly userRepo: IUserRepository,
    @Inject(AUTH_EMAIL_SENDER)
    private readonly emailSender: IEmailSender,
  ) {}

  /** Demande de réinitialisation : crée un token et envoie l'email. */
  async run(dto: RequestPasswordResetDto): Promise<RequestPasswordResetResult> {
    const user = await this.userRepo.findByEmail(dto.email);

    if (!user) {
      return {
        message:
          'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.',
      };
    }

    const token = randomBytes(32).toString('hex');
    await this.userRepo.createToken('PASSWORD_RESET', user.id, token);

    try {
      await this.emailSender.sendPasswordResetEmail(dto.email, token);
    } catch (err) {
      console.error('[RequestPasswordResetUseCase] Envoi email reset MDP échoué:', err);
    }

    return {
      message:
        'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.',
    };
  }
}
