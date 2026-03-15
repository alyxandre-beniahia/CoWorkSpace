import type { IAdminStatsRepository } from '../../domain/repositories/admin-stats.repository.interface';
import type { GetActivityQueryDto } from '../dtos/get-activity-query.dto';

const DEFAULT_LIMIT = 20;

export class GetActivityUseCase {
  constructor(private readonly statsRepository: IAdminStatsRepository) {}

  async run(query: GetActivityQueryDto = {}) {
    const parsed = query.limit != null && query.limit !== '' ? parseInt(query.limit, 10) : DEFAULT_LIMIT;
    return this.statsRepository.getActivity(Number.isNaN(parsed) ? DEFAULT_LIMIT : parsed);
  }
}
