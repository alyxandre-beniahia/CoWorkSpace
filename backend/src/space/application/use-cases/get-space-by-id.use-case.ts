import type { ISpaceRepository, SpaceWithEquipements } from '../../domain/repositories/space.repository.interface';
import { SpaceNotFoundError } from '../../domain/errors/space.errors';

export class GetSpaceByIdUseCase {
  constructor(private readonly spaceRepository: ISpaceRepository) {}

  async run(id: string): Promise<SpaceWithEquipements> {
    const space = await this.spaceRepository.findById(id);
    if (!space) {
      throw new SpaceNotFoundError('Espace non trouvé');
    }
    return space;
  }
}
