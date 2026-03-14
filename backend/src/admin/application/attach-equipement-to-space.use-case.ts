import { Injectable, ConflictException } from '@nestjs/common';
import { AdminSpaceRepository } from '../infrastructure/admin-space.repository';

@Injectable()
export class AttachEquipementToSpaceUseCase {
  constructor(private readonly repository: AdminSpaceRepository) {}

  async run(spaceId: string, equipementId: string, quantity = 1): Promise<{ id: string }> {
    try {
      return await this.repository.attachEquipement(spaceId, equipementId, quantity);
    } catch (e) {
      if (e instanceof Error && e.message.includes('Quantité insuffisante')) {
        throw new ConflictException(e.message);
      }
      throw e;
    }
  }
}
