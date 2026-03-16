import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';

export type JwtPayload = { sub: string; email: string; role: string };

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          if (req?.cookies && typeof req.cookies.access_token === 'string') {
            return req.cookies.access_token;
          }
          return null;
        },
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'dev-secret-change-in-prod',
    });
  }

  async validate(payload: JwtPayload): Promise<{ userId: string; email: string; role: string }> {
    if (!payload.sub) {
      throw new UnauthorizedException();
    }
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
