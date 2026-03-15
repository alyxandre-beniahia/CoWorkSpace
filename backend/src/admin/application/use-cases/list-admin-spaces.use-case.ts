import type { IAdminSpaceRepository } from '../../domain/repositories/admin-space.repository.interface';

export class ListAdminSpacesUseCase {
  constructor(private readonly spaceRepository: IAdminSpaceRepository) {}

  async run() {
    return this.spaceRepository.list();
  }
}
