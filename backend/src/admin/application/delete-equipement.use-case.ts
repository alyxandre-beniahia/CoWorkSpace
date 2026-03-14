import { Injectable, NotFoundException } from '@nestjs/common';
import { AdminEquipementRepository } from '../infrastructure/admin-equipement.repository';

@Injectable()
export class DeleteEquipementUseCase {
  constructor(private readonly repository: AdminEquipementRepository) {}

  async run(id: string): Promise<{ deleted: boolean }> {
    const deleted = await this.repository.delete(id);
    if (!deleted) {
      throw new NotFoundException('Équipement non trouvé');
    }
    return { deleted: true };
  }
}
