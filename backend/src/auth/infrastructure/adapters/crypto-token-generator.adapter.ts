import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import type { ITokenGenerator } from '../../application/ports/token-generator.port';

@Injectable()
export class CryptoTokenGeneratorAdapter implements ITokenGenerator {
  generate(): string {
    return randomBytes(32).toString('hex');
  }
}
