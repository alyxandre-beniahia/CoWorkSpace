import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import type { IAdminStatsRepository } from '../../domain/repositories/admin-stats.repository.interface';
import type { TopSpaceReserved } from '../../domain/entities/admin-dashboard.entity';
import type { IAdminDashboardTimeRanges } from '../../application/ports/dashboard-time-ranges.port';
import {
  durationHoursWithinWindow,
  RESERVATION_HOURS_PER_DAY,
} from '../../../reservation/application/utils/reservation-window.utils';

const UPDATE_THRESHOLD_MS = 2000;
const ACTIVITY_DAYS = 3;

@Injectable()
export class AdminStatsRepository implements IAdminStatsRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly timeRanges: IAdminDashboardTimeRanges,
  ) {}

  async getDashboardStats() {
    const { start: todayStart, end: todayEnd } = this.timeRanges.todayParis();
    const { start: weekStart, end: weekEnd } = this.timeRanges.weekParis();

    const [
      reservationsToday,
      reservationsWeekData,
      reservationsWeekCount,
      spaces,
      activeUsersCount,
      topSpacesGrouped,
      cancelledReservationsWeek,
    ] = await Promise.all([
      this.prisma.reservation.count({
        where: {
          deletedAt: null,
          startDatetime: { lt: todayEnd },
          endDatetime: { gt: todayStart },
        },
      }),
      this.prisma.reservation.findMany({
        where: {
          deletedAt: null,
          startDatetime: { lt: weekEnd },
          endDatetime: { gt: weekStart },
        },
        select: { startDatetime: true, endDatetime: true },
      }),
      this.prisma.reservation.count({
        where: {
          deletedAt: null,
          startDatetime: { lt: weekEnd },
          endDatetime: { gt: weekStart },
        },
      }),
      this.prisma.space.findMany({
        where: { type: { not: 'OTHER' } },
        select: { capacity: true },
      }),
      this.prisma.user.count({
        where: {
          isActive: true,
          role: { slug: 'member' },
        },
      }),
      this.prisma.reservation.groupBy({
        by: ['spaceId'],
        where: {
          deletedAt: null,
          startDatetime: { lt: weekEnd },
          endDatetime: { gt: weekStart },
        },
        _count: { id: true },
      }),
      this.prisma.reservation.count({
        where: {
          deletedAt: { not: null, gte: weekStart, lte: weekEnd },
        },
      }),
    ]);

    const topSpacesSorted = [...topSpacesGrouped].sort((a, b) => b._count.id - a._count.id);
    const topSpaceIds = topSpacesSorted.slice(0, 3).map((g) => g.spaceId);
    const spacesWithNames =
      topSpaceIds.length > 0
        ? await this.prisma.space.findMany({
            where: { id: { in: topSpaceIds } },
            select: { id: true, name: true },
          })
        : [];
    const spaceNameById = Object.fromEntries(spacesWithNames.map((s) => [s.id, s.name]));
    const topSpacesReserved: TopSpaceReserved[] = topSpacesSorted.slice(0, 3).map((g) => ({
      spaceId: g.spaceId,
      spaceName: spaceNameById[g.spaceId] ?? 'Inconnu',
      count: g._count.id,
    }));

    const totalCapacity = spaces.reduce((sum, s) => sum + s.capacity, 0);
    const weekDurationHours = reservationsWeekData.reduce((sum, r) => {
      const start = r.startDatetime < weekStart ? weekStart : r.startDatetime;
      const end = r.endDatetime > weekEnd ? weekEnd : r.endDatetime;
      return sum + durationHoursWithinWindow(start, end);
    }, 0);
    const weekHoursAvailable = totalCapacity * 7 * RESERVATION_HOURS_PER_DAY;
    const occupancyRateWeek =
      weekHoursAvailable > 0
        ? Math.min(100, Math.round((weekDurationHours / weekHoursAvailable) * 100))
        : 0;

    return {
      reservationsToday,
      reservationsWeek: reservationsWeekCount,
      occupancyRateWeek,
      activeUsersCount,
      topSpacesReserved,
      cancelledReservationsWeek,
    };
  }

  async getActivity(limit: number) {
    const take = Math.min(limit, 50);
    const { start: todayStartParis } = this.timeRanges.todayParis();
    const cutoff = new Date(
      todayStartParis.getTime() - ACTIVITY_DAYS * 24 * 3600 * 1000,
    );

    const include = {
      user: { select: { firstname: true, lastname: true } },
      space: { select: { name: true } },
    };

    const [cancelled, active] = await Promise.all([
      this.prisma.reservation.findMany({
        where: { deletedAt: { not: null, gte: cutoff } },
        take,
        orderBy: { deletedAt: 'desc' },
        include,
      }),
      this.prisma.reservation.findMany({
        where: {
          deletedAt: null,
          OR: [{ createdAt: { gte: cutoff } }, { updatedAt: { gte: cutoff } }],
        },
        take,
        orderBy: { updatedAt: 'desc' },
        include,
      }),
    ]);

    const cancelledItems = cancelled.map((r) => ({
      id: r.id,
      createdAt: r.deletedAt!,
      action: 'CANCEL' as const,
      userName: `${r.user.firstname} ${r.user.lastname}`,
      spaceName: r.space.name,
      reservationStart: r.startDatetime,
      reservationEnd: r.endDatetime,
    }));

    const activeItems = active.map((r) => {
      const isUpdate =
        r.updatedAt.getTime() - r.createdAt.getTime() > UPDATE_THRESHOLD_MS;
      return {
        id: r.id,
        createdAt: isUpdate ? r.updatedAt : r.createdAt,
        action: (isUpdate ? 'UPDATE' : 'CREATE') as 'UPDATE' | 'CREATE',
        userName: `${r.user.firstname} ${r.user.lastname}`,
        spaceName: r.space.name,
        reservationStart: r.startDatetime,
        reservationEnd: r.endDatetime,
      };
    });

    return [...cancelledItems, ...activeItems]
      .filter((item) => item.createdAt.getTime() >= cutoff.getTime())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, take);
  }
}
