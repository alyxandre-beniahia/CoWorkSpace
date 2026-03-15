import type { IAdminEquipementRepository } from '../../domain/repositories/admin-equipement.repository.interface';
import type { CreateEquipementDto } from '../dtos/create-equipement.dto';

export class CreateEquipementUseCase {
  constructor(private readonly equipementRepository: IAdminEquipementRepository) {}

  async run(dto: CreateEquipementDto) {
    return this.equipementRepository.create(dto);
  }
}
