import { Injectable } from '@nestjs/common';
import { AdminSpaceRepository } from '../infrastructure/admin-space.repository';

@Injectable()
export class DetachEquipementFromSpaceUseCase {
  constructor(private readonly repository: AdminSpaceRepository) {}

  async run(spaceId: string, equipementId: string, quantity?: number): Promise<{ deleted: boolean }> {
    const deleted = await this.repository.detachEquipement(spaceId, equipementId, quantity);
    return { deleted };
  }
}
