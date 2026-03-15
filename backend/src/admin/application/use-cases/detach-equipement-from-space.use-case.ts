import type { IAdminSpaceRepository } from '../../domain/repositories/admin-space.repository.interface';

export class DetachEquipementFromSpaceUseCase {
  constructor(private readonly spaceRepository: IAdminSpaceRepository) {}

  async run(spaceId: string, equipementId: string, quantity?: number) {
    const deleted = await this.spaceRepository.detachEquipement(spaceId, equipementId, quantity);
    return { deleted };
  }
}
