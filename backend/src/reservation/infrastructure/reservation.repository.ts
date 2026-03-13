import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import type { ReservationListFilters } from "../domain/reservation-list.filters";
import type {
  IReservationRepository,
  ReservationCalendarItem,
} from "../domain/reservation.repository.interface";
import type {
  ReservationListItem,
  ReservationWithDetails,
  CreateReservationInput,
  UpdateReservationInput,
} from "../domain/reservation.entity";

@Injectable()
export class ReservationRepository implements IReservationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async list(filters: ReservationListFilters): Promise<ReservationListItem[]> {
    const where: Prisma.ReservationWhereInput = { deletedAt: null };
    if (filters.userId) where.userId = filters.userId;
    if (filters.spaceId) where.spaceId = filters.spaceId;
    if (filters.from && filters.to) {
      where.AND = [
        { endDatetime: { gt: filters.from } },
        { startDatetime: { lt: filters.to } },
      ];
    } else if (filters.from) {
      where.endDatetime = { gt: filters.from };
    } else if (filters.to) {
      where.startDatetime = { lt: filters.to };
    }

    const reservations = await this.prisma.reservation.findMany({
      where,
      include: {
        space: true,
        user: { select: { id: true } },
      },
      orderBy: { startDatetime: "asc" },
    });

    return reservations.map((r: (typeof reservations)[number]) => {
      const maskPrivate =
        filters.currentUserId &&
        r.isPrivate &&
        r.userId !== filters.currentUserId;
      const isOwner = Boolean(
        filters.currentUserId && r.userId === filters.currentUserId,
      );
      return {
        id: r.id,
        spaceId: r.spaceId,
        spaceName: r.space.name,
        userId: r.userId,
        startDatetime: r.startDatetime,
        endDatetime: r.endDatetime,
        title: maskPrivate ? null : r.title,
        isPrivate: r.isPrivate,
        recurrenceGroupId: r.recurrenceGroupId ?? null,
        isOwner,
      };
    });
  }

  async findById(
    id: string,
    currentUserId?: string,
  ): Promise<ReservationWithDetails | null> {
    const r = await this.prisma.reservation.findFirst({
      where: { id, deletedAt: null },
      include: {
        space: true,
        user: {
          select: { id: true, firstname: true, lastname: true, email: true },
        },
      },
    });
    if (!r) return null;

    const maskPrivate =
      currentUserId && r.isPrivate && r.userId !== currentUserId;
    const isOwner = Boolean(currentUserId && r.userId === currentUserId);
    return {
      id: r.id,
      spaceId: r.spaceId,
      spaceName: r.space.name,
      userId: r.userId,
      startDatetime: r.startDatetime,
      endDatetime: r.endDatetime,
      title: maskPrivate ? null : r.title,
      isPrivate: r.isPrivate,
      recurrenceGroupId: r.recurrenceGroupId ?? null,
      isOwner,
      userName: maskPrivate ? "" : `${r.user.firstname} ${r.user.lastname}`,
      userEmail: maskPrivate ? "" : r.user.email,
    };
  }

  async create(input: CreateReservationInput): Promise<ReservationWithDetails> {
    const r = await this.prisma.reservation.create({
      data: {
        spaceId: input.spaceId,
        userId: input.userId,
        startDatetime: input.startDatetime,
        endDatetime: input.endDatetime,
        title: input.title ?? null,
        isPrivate: input.isPrivate ?? false,
        recurrenceRule: input.recurrenceRule ?? null,
        recurrenceEndAt: input.recurrenceEndAt ?? null,
        recurrenceGroupId: input.recurrenceGroupId ?? null,
      },
      include: {
        space: true,
        user: {
          select: { id: true, firstname: true, lastname: true, email: true },
        },
      },
    });

    return {
      id: r.id,
      spaceId: r.spaceId,
      spaceName: r.space.name,
      userId: r.userId,
      startDatetime: r.startDatetime,
      endDatetime: r.endDatetime,
      title: r.title,
      isPrivate: r.isPrivate,
      recurrenceGroupId: r.recurrenceGroupId ?? null,
      isOwner: true,
      userName: `${r.user.firstname} ${r.user.lastname}`,
      userEmail: r.user.email,
    };
  }

  async createMany(
    inputs: CreateReservationInput[],
  ): Promise<ReservationWithDetails[]> {
    const results: ReservationWithDetails[] = [];
    for (const input of inputs) {
      const created = await this.create(input);
      results.push(created);
    }
    return results;
  }

  async update(
    id: string,
    input: UpdateReservationInput,
  ): Promise<ReservationWithDetails | null> {
    const r = await this.prisma.reservation.updateMany({
      where: { id, deletedAt: null },
      data: {
        ...(input.startDatetime && { startDatetime: input.startDatetime }),
        ...(input.endDatetime && { endDatetime: input.endDatetime }),
        ...(input.title !== undefined && { title: input.title }),
        ...(input.isPrivate !== undefined && { isPrivate: input.isPrivate }),
        ...(input.recurrenceRule !== undefined && {
          recurrenceRule: input.recurrenceRule,
        }),
        ...(input.recurrenceEndAt !== undefined && {
          recurrenceEndAt: input.recurrenceEndAt,
        }),
      },
    });

    if (r.count === 0) return null;
    return this.findById(id, undefined);
  }

  async softDelete(id: string): Promise<boolean> {
    const r = await this.prisma.reservation.updateMany({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    return r.count > 0;
  }

  async softDeleteByRecurrenceGroupId(
    recurrenceGroupId: string,
  ): Promise<number> {
    const r = await this.prisma.reservation.updateMany({
      where: { recurrenceGroupId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    return r.count;
  }

  async hasOverlap(
    spaceId: string,
    start: Date,
    end: Date,
    excludeReservationId?: string,
  ): Promise<boolean> {
    const where: Prisma.ReservationWhereInput = {
      spaceId,
      deletedAt: null,
      OR: [{ startDatetime: { lt: end }, endDatetime: { gt: start } }],
    };
    if (excludeReservationId) {
      where.id = { not: excludeReservationId };
    }

    const count = await this.prisma.reservation.count({ where });
    return count > 0;
  }

  async listForCalendar(params: {
    spaceId?: string;
    start: Date;
    end: Date;
  }): Promise<ReservationCalendarItem[]> {
    const where: Prisma.ReservationWhereInput = {
      deletedAt: null,
      startDatetime: { lt: params.end },
      endDatetime: { gt: params.start },
    };
    if (params.spaceId) {
      where.spaceId = params.spaceId;
    }

    const items = await this.prisma.reservation.findMany({
      where,
      select: {
        id: true,
        spaceId: true,
        userId: true,
        startDatetime: true,
        endDatetime: true,
        isPrivate: true,
        title: true,
      },
      orderBy: { startDatetime: "asc" },
    });

    return items.map((r) => ({
      id: r.id,
      spaceId: r.spaceId,
      userId: r.userId,
      startDatetime: r.startDatetime,
      endDatetime: r.endDatetime,
      isPrivate: r.isPrivate,
      title: r.title,
    }));
  }
}
