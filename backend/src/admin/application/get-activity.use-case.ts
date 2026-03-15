import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { getTodayStartEndParis } from '../../reservation/application/utils/reservation-window.utils';

export type ActivityItem = {
  id: string;
  createdAt: Date;
  action: string;
  userName: string;
  spaceName: string | null;
  reservationStart: Date | null;
  reservationEnd: Date | null;
};

/** Dérive l'activité récente depuis la table Reservation (createdAt, updatedAt, deletedAt). Limité aux 3 derniers jours. */
@Injectable()
export class GetActivityUseCase {
  private static readonly DEFAULT_LIMIT = 20;
  private static readonly UPDATE_THRESHOLD_MS = 2000;
  private static readonly ACTIVITY_DAYS = 3;

  constructor(private readonly prisma: PrismaService) {}

  async run(limit = GetActivityUseCase.DEFAULT_LIMIT): Promise<ActivityItem[]> {
    const take = Math.min(limit, 50);
    const { start: todayStartParis } = getTodayStartEndParis();
    const cutoff = new Date(todayStartParis.getTime() - GetActivityUseCase.ACTIVITY_DAYS * 24 * 3600 * 1000);

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

    const cancelledItems: ActivityItem[] = cancelled.map((r) => ({
      id: r.id,
      createdAt: r.deletedAt!,
      action: 'CANCEL',
      userName: `${r.user.firstname} ${r.user.lastname}`,
      spaceName: r.space.name,
      reservationStart: r.startDatetime,
      reservationEnd: r.endDatetime,
    }));

    const activeItems: ActivityItem[] = active.map((r) => {
      const isUpdate =
        r.updatedAt.getTime() - r.createdAt.getTime() > GetActivityUseCase.UPDATE_THRESHOLD_MS;
      return {
        id: r.id,
        createdAt: isUpdate ? r.updatedAt : r.createdAt,
        action: isUpdate ? 'UPDATE' : 'CREATE',
        userName: `${r.user.firstname} ${r.user.lastname}`,
        spaceName: r.space.name,
        reservationStart: r.startDatetime,
        reservationEnd: r.endDatetime,
      };
    });

    const merged = [...cancelledItems, ...activeItems]
      .filter((item) => item.createdAt.getTime() >= cutoff.getTime())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, take);

    return merged;
  }
}
