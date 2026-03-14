import { Injectable } from '@nestjs/common';
import type { AdminSpaceListItem, UpdateSpaceInput } from '../domain/admin-space.repository.interface';
import { AdminSpaceRepository } from '../infrastructure/admin-space.repository';

@Injectable()
export class UpdateSpaceUseCase {
  constructor(private readonly repository: AdminSpaceRepository) {}

  async run(id: string, input: UpdateSpaceInput): Promise<AdminSpaceListItem | null> {
    return this.repository.update(id, input);
  }
}
