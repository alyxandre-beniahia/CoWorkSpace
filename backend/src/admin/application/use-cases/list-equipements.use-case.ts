import type { IAdminEquipementRepository } from '../../domain/repositories/admin-equipement.repository.interface';

export class ListEquipementsUseCase {
  constructor(private readonly equipementRepository: IAdminEquipementRepository) {}

  async run() {
    return this.equipementRepository.list();
  }
}
