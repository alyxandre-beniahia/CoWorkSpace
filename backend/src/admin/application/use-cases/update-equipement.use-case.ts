import type { IAdminEquipementRepository } from '../../domain/repositories/admin-equipement.repository.interface';
import type { UpdateEquipementDto } from '../dtos/update-equipement.dto';

export class UpdateEquipementUseCase {
  constructor(private readonly equipementRepository: IAdminEquipementRepository) {}

  async run(id: string, dto: UpdateEquipementDto) {
    return this.equipementRepository.update(id, dto);
  }
}
