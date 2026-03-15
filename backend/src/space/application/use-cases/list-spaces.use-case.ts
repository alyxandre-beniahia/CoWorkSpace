import type { ISpaceRepository, SpaceListItem } from '../../domain/repositories/space.repository.interface';
import type { SpaceListFilters } from '../../domain/filters/space-list.filters';

export class ListSpacesUseCase {
  constructor(private readonly spaceRepository: ISpaceRepository) {}

  async run(filters: SpaceListFilters): Promise<SpaceListItem[]> {
    return this.spaceRepository.list(filters);
  }
}
