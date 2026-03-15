import type { IAdminSpaceRepository } from '../../domain/repositories/admin-space.repository.interface';
import { AdminConflictError } from '../../domain/errors/admin.errors';

export class AttachEquipementToSpaceUseCase {
  constructor(private readonly spaceRepository: IAdminSpaceRepository) {}

  async run(spaceId: string, equipementId: string, quantity = 1) {
    try {
      return await this.spaceRepository.attachEquipement(spaceId, equipementId, quantity);
    } catch (e) {
      if (e instanceof Error && e.message.includes('Quantité insuffisante')) {
        throw new AdminConflictError(e.message);
      }
      throw e;
    }
  }
}
