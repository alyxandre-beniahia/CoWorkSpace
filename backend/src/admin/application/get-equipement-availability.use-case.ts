import { Injectable, NotFoundException } from '@nestjs/common';
import type { EquipementAvailability } from '../domain/admin-equipement.repository.interface';
import { AdminEquipementRepository } from '../infrastructure/admin-equipement.repository';

@Injectable()
export class GetEquipementAvailabilityUseCase {
  constructor(private readonly repository: AdminEquipementRepository) {}

  async run(equipementId: string): Promise<EquipementAvailability> {
    const equipement = await this.repository.getById(equipementId);
    if (!equipement) {
      throw new NotFoundException('Équipement non trouvé');
    }
    const assigned = await this.repository.getAssignedQuantity(equipementId);
    return {
      total: equipement.quantity,
      assigned,
      available: Math.max(0, equipement.quantity - assigned),
    };
  }
}
