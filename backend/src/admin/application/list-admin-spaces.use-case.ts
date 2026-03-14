import { Injectable } from '@nestjs/common';
import type { AdminSpaceListItem } from '../domain/admin-space.repository.interface';
import { AdminSpaceRepository } from '../infrastructure/admin-space.repository';

@Injectable()
export class ListAdminSpacesUseCase {
  constructor(private readonly repository: AdminSpaceRepository) {}

  async run(): Promise<AdminSpaceListItem[]> {
    return this.repository.list();
  }
}
