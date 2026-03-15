import { Injectable } from '@nestjs/common';
import type { IAvatarUrlProvider } from '../../application/ports/avatar-url.port';
import { getDiceBearAvatarUrl } from '../utils/avatar.utils';

@Injectable()
export class AvatarUrlAdapter implements IAvatarUrlProvider {
  getAvatarUrl(userId: string): string {
    return getDiceBearAvatarUrl(userId);
  }
}
