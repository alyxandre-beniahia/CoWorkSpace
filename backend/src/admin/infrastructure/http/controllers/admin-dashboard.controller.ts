import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { AdminGuard } from '../../../../shared/guards/admin.guard';
import { GetDashboardStatsUseCase } from '../../../application/use-cases/get-dashboard-stats.use-case';
import { GetActivityUseCase } from '../../../application/use-cases/get-activity.use-case';
import type { GetActivityQueryDto } from '../../../application/dtos/get-activity-query.dto';
import { ADMIN_PREFIX_DASHBOARD, ADMIN_ROUTES_DASHBOARD } from '../routes/admin.routes';

@Controller(ADMIN_PREFIX_DASHBOARD)
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminDashboardController {
  constructor(
    private readonly getDashboardStatsUseCase: GetDashboardStatsUseCase,
    private readonly getActivityUseCase: GetActivityUseCase,
  ) {}

  @Get(ADMIN_ROUTES_DASHBOARD.STATS)
  async getStats() {
    return this.getDashboardStatsUseCase.run();
  }

  @Get(ADMIN_ROUTES_DASHBOARD.ACTIVITY)
  async getActivity(@Query() query: GetActivityQueryDto) {
    return this.getActivityUseCase.run(query);
  }
}
