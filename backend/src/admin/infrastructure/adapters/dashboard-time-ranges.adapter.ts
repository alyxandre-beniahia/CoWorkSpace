import { Injectable } from '@nestjs/common';
import type { IAdminDashboardTimeRanges } from '../../application/ports/dashboard-time-ranges.port';
import {
  getTodayStartEndParis,
  getWeekStartEndParis,
} from '../../../reservation/application/utils/reservation-window.utils';

@Injectable()
export class DashboardTimeRangesAdapter implements IAdminDashboardTimeRanges {
  todayParis() {
    return getTodayStartEndParis();
  }

  weekParis() {
    return getWeekStartEndParis();
  }
}
