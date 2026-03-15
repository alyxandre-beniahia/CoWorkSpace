import type { IAdminEquipementRepository } from '../../domain/repositories/admin-equipement.repository.interface';
import { AdminNotFoundError } from '../../domain/errors/admin.errors';

export class DeleteEquipementUseCase {
  constructor(private readonly equipementRepository: IAdminEquipementRepository) {}

  async run(id: string) {
    const deleted = await this.equipementRepository.delete(id);
    if (!deleted) {
      throw new AdminNotFoundError('Équipement non trouvé');
    }
    return { deleted: true };
  }
}
