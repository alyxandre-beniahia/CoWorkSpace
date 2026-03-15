import type { IAdminSpaceRepository } from '../../domain/repositories/admin-space.repository.interface';
import type { CreateSpaceDto } from '../dtos/create-space.dto';

export class CreateSpaceUseCase {
  constructor(private readonly spaceRepository: IAdminSpaceRepository) {}

  async run(dto: CreateSpaceDto) {
    return this.spaceRepository.create(dto);
  }
}
