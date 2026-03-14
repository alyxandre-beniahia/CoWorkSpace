import { Injectable, NotFoundException } from '@nestjs/common';
import { SpaceRepository } from '../infrastructure/space.repository';
import type { SeatListItem } from '../domain/space.repository.interface';

@Injectable()
export class ListSeatsBySpaceUseCase {
  constructor(private readonly spaceRepository: SpaceRepository) {}

  async run(spaceId: string): Promise<SeatListItem[]> {
    const space = await this.spaceRepository.findById(spaceId);
    if (!space) {
      throw new NotFoundException('Espace non trouvé');
    }
    return this.spaceRepository.findSeatsBySpaceId(spaceId);
  }
}
