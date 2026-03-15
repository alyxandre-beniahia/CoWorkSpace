import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  durationHoursWithinWindow,
  RESERVATION_HOURS_PER_DAY,
  getTodayStartEndParis,
  getWeekStartEndParis,
} from '../../reservation/application/reservation-window.utils';

export type TopSpaceReserved = {
  spaceId: string;
  spaceName: string;
  count: number;
};

export type DashboardStats = {
  reservationsToday: number;
  reservationsWeek: number;
  occupancyRateWeek: number;
  activeUsersCount: number;
  topSpacesReserved: TopSpaceReserved[];
  cancelledReservationsWeek: number;
};

@Injectable()
export class GetDashboardStatsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async run(): Promise<DashboardStats> {
    const { start: todayStart, end: todayEnd } = getTodayStartEndParis();
    const { start: weekStart, end: weekEnd } = getWeekStartEndParis();

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
}
