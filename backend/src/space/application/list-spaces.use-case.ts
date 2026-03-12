import { Injectable } from '@nestjs/common';
import { SpaceRepository } from '../infrastructure/space.repository';
import type { SpaceListFilters } from '../domain/space-list.filters';
import type { SpaceListItem } from '../domain/space.repository.interface';

@Injectable()
export class ListSpacesUseCase {
  constructor(private readonly spaceRepository: SpaceRepository) {}

  async run(filters: SpaceListFilters): Promise<SpaceListItem[]> {
    return this.spaceRepository.list(filters);
  }
}
