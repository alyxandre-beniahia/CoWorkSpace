import { Injectable, NotFoundException } from '@nestjs/common';
import { AdminSpaceRepository } from '../infrastructure/admin-space.repository';

@Injectable()
export class DeleteSpaceUseCase {
  constructor(private readonly repository: AdminSpaceRepository) {}

  async run(id: string): Promise<{ deleted: boolean }> {
    const deleted = await this.repository.delete(id);
    if (!deleted) {
      throw new NotFoundException('Espace non trouvé');
    }
    return { deleted: true };
  }
}
