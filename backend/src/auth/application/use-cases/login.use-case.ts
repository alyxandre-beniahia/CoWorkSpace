import { Injectable, Inject } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { InvalidCredentialsError } from '../../domain/errors/auth.errors';
import type { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { AUTH_USER_REPOSITORY } from '../../domain/repositories/user.repository.interface';
import type { IAuthTokenService } from '../ports/auth-token.port';
import { AUTH_TOKEN_SERVICE } from '../ports/auth-token.port';
import type { LoginDto } from '../dtos/login.dto';

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(AUTH_USER_REPOSITORY)
    private readonly userRepo: IUserRepository,
    @Inject(AUTH_TOKEN_SERVICE)
    private readonly authTokenService: IAuthTokenService,
  ) {}

  async run(dto: LoginDto): Promise<{ access_token: string }> {
    const user = await this.userRepo.findByEmailForLogin(dto.email);
    if (!user || !user.isActive) {
      throw new InvalidCredentialsError('Identifiants incorrects');
    }
    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new InvalidCredentialsError('Identifiants incorrects');
    }
    const payload = { sub: user.id, email: user.email, role: user.role.slug };
    const access_token = this.authTokenService.sign(payload);
    return { access_token };
  }
}
