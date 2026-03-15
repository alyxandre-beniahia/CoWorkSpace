import type { IAdminStatsRepository } from '../../domain/repositories/admin-stats.repository.interface';

export class GetDashboardStatsUseCase {
  constructor(private readonly statsRepository: IAdminStatsRepository) {}

  async run() {
    return this.statsRepository.getDashboardStats();
  }
}
