import { Injectable } from '@nestjs/common';
import type { EquipementListItem, UpdateEquipementInput } from '../domain/admin-equipement.repository.interface';
import { AdminEquipementRepository } from '../infrastructure/admin-equipement.repository';

@Injectable()
export class UpdateEquipementUseCase {
  constructor(private readonly repository: AdminEquipementRepository) {}

  async run(id: string, input: UpdateEquipementInput): Promise<EquipementListItem | null> {
    return this.repository.update(id, input);
  }
}
