import type { IAdminEquipementRepository } from '../../domain/repositories/admin-equipement.repository.interface';
import { AdminNotFoundError } from '../../domain/errors/admin.errors';

export class GetEquipementAvailabilityUseCase {
  constructor(private readonly equipementRepository: IAdminEquipementRepository) {}

  async run(equipementId: string) {
    const equipement = await this.equipementRepository.getById(equipementId);
    if (!equipement) {
      throw new AdminNotFoundError('Équipement non trouvé');
    }
    const assigned = await this.equipementRepository.getAssignedQuantity(equipementId);
    return {
      total: equipement.quantity,
      assigned,
      available: Math.max(0, equipement.quantity - assigned),
    };
  }
}
