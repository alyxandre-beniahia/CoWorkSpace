import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import type { SpaceListFilters } from '../domain/space-list.filters';
import type {
  ISpaceRepository,
  SeatListItem,
  SpaceListItem,
  SpaceWithEquipements,
} from '../domain/space.repository.interface';

@Injectable()
export class SpaceRepository implements ISpaceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async list(filters: SpaceListFilters): Promise<SpaceListItem[]> {
    const where: Prisma.SpaceWhereInput = {};
    if (filters.type) where.type = filters.type;
    if (filters.capacityMin != null || filters.capacityMax != null) {
      where.capacity = {};
      if (filters.capacityMin != null) where.capacity.gte = filters.capacityMin;
      if (filters.capacityMax != null) where.capacity.lte = filters.capacityMax;
    }
    if (filters.equipementId) {
      where.spaceEquipements = {
        some: { equipementId: filters.equipementId },
      };
    }
    const spaces = await this.prisma.space.findMany({
      where,
      include: {
        spaceEquipements: { include: { equipement: true } },
      },
      orderBy: { name: 'asc' },
    });
    return spaces.map((s) => ({
      id: s.id,
      name: s.name,
      code: s.code,
      type: s.type,
      capacity: s.capacity,
      status: s.status,
      positionX: s.positionX,
      positionY: s.positionY,
      equipements: s.spaceEquipements.map((se) => se.equipement.name),
    }));
  }

  async findById(id: string): Promise<SpaceWithEquipements | null> {
    const space = await this.prisma.space.findUnique({
      where: { id },
      include: {
        spaceEquipements: { include: { equipement: true } },
      },
    });
    if (!space) return null;
    return {
      id: space.id,
      name: space.name,
      code: space.code,
      type: space.type,
      capacity: space.capacity,
      status: space.status,
      description: space.description,
      positionX: space.positionX,
      positionY: space.positionY,
      equipements: space.spaceEquipements.map((se) => ({ name: se.equipement.name })),
    };
  }

  async findSeatsBySpaceId(spaceId: string): Promise<SeatListItem[]> {
    const seats = await this.prisma.seat.findMany({
      where: { spaceId },
      orderBy: { code: 'asc' },
    });
    return seats.map((s) => ({
      id: s.id,
      spaceId: s.spaceId,
      code: s.code,
      positionX: s.positionX,
      positionY: s.positionY,
    }));
  }
}
