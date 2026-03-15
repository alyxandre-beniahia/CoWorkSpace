import type { ISpaceRepository, SeatListItem } from '../../domain/repositories/space.repository.interface';
import { SpaceNotFoundError } from '../../domain/errors/space.errors';

export class ListSeatsBySpaceUseCase {
  constructor(private readonly spaceRepository: ISpaceRepository) {}

  async run(spaceId: string): Promise<SeatListItem[]> {
    const space = await this.spaceRepository.findById(spaceId);
    if (!space) {
      throw new SpaceNotFoundError('Espace non trouvé');
    }
    return this.spaceRepository.findSeatsBySpaceId(spaceId);
  }
}
