import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { IAuthTokenService, AuthTokenPayload } from '../../application/ports/auth-token.port';

@Injectable()
export class JwtAuthTokenService implements IAuthTokenService {
  constructor(private readonly jwtService: JwtService) {}

  sign(payload: AuthTokenPayload): string {
    return this.jwtService.sign(payload, { expiresIn: '7d' });
  }
}
