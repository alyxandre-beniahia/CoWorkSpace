import { EmailAlreadyExistsError, RoleMissingError } from '../../domain/errors/auth.errors';
import type { IUserRepository } from '../../domain/repositories/user.repository.interface';
import type { IEmailSender } from '../ports/email-sender.port';
import type { IPasswordHasher } from '../ports/password-hasher.port';
import type { ITokenGenerator } from '../ports/token-generator.port';
import type { RegisterDto } from '../dtos/register.dto';

type RegisterResult = {
  message: string;
};

export class RegisterUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly emailSender: IEmailSender,
    private readonly passwordHasher: IPasswordHasher,
    private readonly tokenGenerator: ITokenGenerator,
  ) {}

  /** Crée un compte inactif et un token de vérification email (l'envoi d'email est géré ailleurs). */
  async run(dto: RegisterDto): Promise<RegisterResult> {
    const existing = await this.userRepo.findByEmail(dto.email);
    if (existing) {
      throw new EmailAlreadyExistsError('Un compte existe déjà avec cet email');
    }

    const roleMemberId = await this.userRepo.findRoleIdBySlug('member');
    if (!roleMemberId) {
      throw new RoleMissingError('Rôle member manquant en base');
    }

    const passwordHash = await this.passwordHasher.hash(dto.password);
    const token = this.tokenGenerator.generate();

    const user = await this.userRepo.createUser({
      firstname: dto.firstname,
      lastname: dto.lastname,
      email: dto.email,
      passwordHash,
      roleId: roleMemberId,
      isActive: false,
    });

    await this.userRepo.createToken('EMAIL_VERIFICATION', user.id, token);

    try {
      await this.emailSender.sendVerificationEmail(user.email, token);
    } catch (err) {
      console.error('[RegisterUseCase] Envoi email vérification échoué:', err);
    }

    return {
      message: 'Inscription enregistrée. Vérifiez vos emails pour valider votre compte.',
    };
  }
}
