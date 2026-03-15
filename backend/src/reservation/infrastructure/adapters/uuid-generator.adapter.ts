import { Injectable } from '@nestjs/common';
import type { IIdGenerator } from '../../application/ports/id-generator.port';

@Injectable()
export class UuidGeneratorAdapter implements IIdGenerator {
  generate(): string {
    return crypto.randomUUID();
  }
}
