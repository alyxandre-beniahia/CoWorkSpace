import type { IAdminSpaceRepository } from '../../domain/repositories/admin-space.repository.interface';
import { AdminNotFoundError } from '../../domain/errors/admin.errors';

export class DeleteSpaceUseCase {
  constructor(private readonly spaceRepository: IAdminSpaceRepository) {}

  async run(id: string) {
    const deleted = await this.spaceRepository.delete(id);
    if (!deleted) {
      throw new AdminNotFoundError('Espace non trouvé');
    }
    return { deleted: true };
  }
}
