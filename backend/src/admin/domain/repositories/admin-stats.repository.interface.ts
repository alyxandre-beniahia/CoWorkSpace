import type { DashboardStats, ActivityItem } from '../entities/admin-dashboard.entity';

export const ADMIN_STATS_REPOSITORY = 'IAdminStatsRepository';

export interface IAdminStatsRepository {
  getDashboardStats(): Promise<DashboardStats>;
  getActivity(limit: number): Promise<ActivityItem[]>;
}
