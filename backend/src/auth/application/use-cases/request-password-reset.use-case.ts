import type { IUserRepository } from '../../domain/repositories/user.repository.interface';
import type { IEmailSender } from '../ports/email-sender.port';
import type { ITokenGenerator } from '../ports/token-generator.port';
import type { RequestPasswordResetDto } from '../dtos/request-password-reset.dto';

type RequestPasswordResetResult = {
  message: string;
};

export class RequestPasswordResetUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly emailSender: IEmailSender,
    private readonly tokenGenerator: ITokenGenerator,
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

    const token = this.tokenGenerator.generate();
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
