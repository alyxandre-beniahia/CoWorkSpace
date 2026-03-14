import { Injectable } from '@nestjs/common';
import type { EquipementListItem } from '../domain/admin-equipement.repository.interface';
import { AdminEquipementRepository } from '../infrastructure/admin-equipement.repository';

@Injectable()
export class ListEquipementsUseCase {
  constructor(private readonly repository: AdminEquipementRepository) {}

  async run(): Promise<EquipementListItem[]> {
    return this.repository.list();
  }
}
