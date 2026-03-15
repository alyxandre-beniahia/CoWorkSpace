import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/infrastructure/jwt-auth.guard';
import { AdminGuard } from '../auth/infrastructure/admin.guard';
import { GetDashboardStatsUseCase } from './application/get-dashboard-stats.use-case';
import { GetActivityUseCase } from './application/get-activity.use-case';

@Controller('admin/dashboard')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminDashboardController {
  constructor(
    private readonly getDashboardStatsUseCase: GetDashboardStatsUseCase,
    private readonly getActivityUseCase: GetActivityUseCase,
  ) {}

  @Get()
  async getStats() {
    return this.getDashboardStatsUseCase.run();
  }

  @Get('activity')
  async getActivity(@Query('limit') limit?: string) {
    const parsed = limit ? parseInt(limit, 10) : 20;
    return this.getActivityUseCase.run(Number.isNaN(parsed) ? 20 : parsed);
  }
}
