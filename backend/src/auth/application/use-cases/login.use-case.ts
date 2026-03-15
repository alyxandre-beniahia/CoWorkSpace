import { InvalidCredentialsError } from '../../domain/errors/auth.errors';
import type { IUserRepository } from '../../domain/repositories/user.repository.interface';
import type { IAuthTokenService } from '../ports/auth-token.port';
import type { IPasswordHasher } from '../ports/password-hasher.port';
import type { LoginDto } from '../dtos/login.dto';

export class LoginUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly authTokenService: IAuthTokenService,
    private readonly passwordHasher: IPasswordHasher,
  ) {}

  async run(dto: LoginDto): Promise<{ access_token: string }> {
    const user = await this.userRepo.findByEmailForLogin(dto.email);
    if (!user || !user.isActive) {
      throw new InvalidCredentialsError('Identifiants incorrects');
    }
    const isPasswordValid = await this.passwordHasher.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new InvalidCredentialsError('Identifiants incorrects');
    }
    const payload = { sub: user.id, email: user.email, role: user.role.slug };
    const access_token = this.authTokenService.sign(payload);
    return { access_token };
  }
}
