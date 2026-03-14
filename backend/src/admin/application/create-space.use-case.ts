import { Injectable } from '@nestjs/common';
import type { AdminSpaceListItem, CreateSpaceInput } from '../domain/admin-space.repository.interface';
import { AdminSpaceRepository } from '../infrastructure/admin-space.repository';

@Injectable()
export class CreateSpaceUseCase {
  constructor(private readonly repository: AdminSpaceRepository) {}

  async run(input: CreateSpaceInput): Promise<AdminSpaceListItem> {
    return this.repository.create(input);
  }
}
