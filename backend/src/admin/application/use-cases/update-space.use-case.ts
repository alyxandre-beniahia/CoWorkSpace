import type { IAdminSpaceRepository } from '../../domain/repositories/admin-space.repository.interface';
import type { UpdateSpaceDto } from '../dtos/update-space.dto';

export class UpdateSpaceUseCase {
  constructor(private readonly spaceRepository: IAdminSpaceRepository) {}

  async run(id: string, dto: UpdateSpaceDto) {
    return this.spaceRepository.update(id, dto);
  }
}
