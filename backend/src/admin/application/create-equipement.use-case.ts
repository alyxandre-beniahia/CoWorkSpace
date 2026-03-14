import { Injectable } from '@nestjs/common';
import type { EquipementListItem, CreateEquipementInput } from '../domain/admin-equipement.repository.interface';
import { AdminEquipementRepository } from '../infrastructure/admin-equipement.repository';

@Injectable()
export class CreateEquipementUseCase {
  constructor(private readonly repository: AdminEquipementRepository) {}

  async run(input: CreateEquipementInput): Promise<EquipementListItem> {
    return this.repository.create(input);
  }
}
