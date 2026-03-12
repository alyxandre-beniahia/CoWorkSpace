import { Injectable, NotFoundException } from '@nestjs/common';
import { SpaceRepository } from '../infrastructure/space.repository';
import type { SpaceWithEquipements } from '../domain/space.repository.interface';

@Injectable()
export class GetSpaceByIdUseCase {
  constructor(private readonly spaceRepository: SpaceRepository) {}

  async run(id: string): Promise<SpaceWithEquipements> {
    const space = await this.spaceRepository.findById(id);
    if (!space) {
      throw new NotFoundException('Espace non trouvé');
    }
    return space;
  }
}
