import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import type {
  IAdminSpaceRepository,
  AdminSpaceListItem,
  CreateSpaceInput,
  UpdateSpaceInput,
} from '../domain/admin-space.repository.interface';
import { SpaceType, SpaceStatus } from '@prisma/client';

@Injectable()
export class AdminSpaceRepository implements IAdminSpaceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<AdminSpaceListItem[]> {
    const spaces = await this.prisma.space.findMany({
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
      description: s.description,
      positionX: s.positionX,
      positionY: s.positionY,
      equipements: s.spaceEquipements.map((se) => ({
        id: se.equipement.id,
        name: se.equipement.name,
        quantity: se.quantity,
      })),
    }));
  }

  async create(input: CreateSpaceInput): Promise<AdminSpaceListItem> {
    const space = await this.prisma.space.create({
      data: {
        name: input.name,
        code: input.code ?? null,
        type: input.type as SpaceType,
        capacity: input.capacity,
        description: input.description ?? null,
        positionX: input.positionX ?? null,
        positionY: input.positionY ?? null,
      },
      include: {
        spaceEquipements: { include: { equipement: true } },
      },
    });
    return this.toListItem(space);
  }

  async update(id: string, input: UpdateSpaceInput): Promise<AdminSpaceListItem | null> {
    try {
      const space = await this.prisma.space.update({
        where: { id },
        data: {
          ...(input.name !== undefined && { name: input.name }),
          ...(input.code !== undefined && { code: input.code }),
          ...(input.type !== undefined && { type: input.type as SpaceType }),
          ...(input.capacity !== undefined && { capacity: input.capacity }),
          ...(input.description !== undefined && { description: input.description }),
          ...(input.positionX !== undefined && { positionX: input.positionX }),
          ...(input.positionY !== undefined && { positionY: input.positionY }),
          ...(input.status !== undefined && { status: input.status as SpaceStatus }),
        },
        include: {
          spaceEquipements: { include: { equipement: true } },
        },
      });
      return this.toListItem(space);
    } catch {
      return null;
    }
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.prisma.space.deleteMany({ where: { id } });
    return result.count > 0;
  }

  async attachEquipement(spaceId: string, equipementId: string, quantity = 1): Promise<{ id: string }> {
    const existing = await this.prisma.spaceEquipement.findUnique({
      where: { spaceId_equipementId: { spaceId, equipementId } },
      select: { id: true, quantity: true },
    });
    const equipement = await this.prisma.equipement.findUnique({
      where: { id: equipementId },
      select: { quantity: true },
    });
    if (!equipement) throw new Error('Equipement not found');
    const assigned = await this.prisma.spaceEquipement.aggregate({
      where: { equipementId },
      _sum: { quantity: true },
    });
    const totalAssigned = assigned._sum.quantity ?? 0;
    const currentInSpace = existing?.quantity ?? 0;
    const available = equipement.quantity - totalAssigned + currentInSpace;
    if (available < quantity) {
      throw new Error('Quantité insuffisante disponible');
    }
    if (existing) {
      await this.prisma.spaceEquipement.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + quantity },
      });
      return { id: existing.id };
    }
    const link = await this.prisma.spaceEquipement.create({
      data: { spaceId, equipementId, quantity },
      select: { id: true },
    });
    return link;
  }

  async detachEquipement(spaceId: string, equipementId: string, quantity?: number): Promise<boolean> {
    const existing = await this.prisma.spaceEquipement.findUnique({
      where: { spaceId_equipementId: { spaceId, equipementId } },
      select: { id: true, quantity: true },
    });
    if (!existing) return false;
    const toRemove = quantity ?? existing.quantity;
    if (toRemove >= existing.quantity) {
      const result = await this.prisma.spaceEquipement.deleteMany({
        where: { spaceId, equipementId },
      });
      return result.count > 0;
    }
    await this.prisma.spaceEquipement.update({
      where: { id: existing.id },
      data: { quantity: existing.quantity - toRemove },
    });
    return true;
  }

  private toListItem(space: {
    id: string;
    name: string;
    code: string | null;
    type: string;
    capacity: number;
    status: string;
    description: string | null;
    positionX: number | null;
    positionY: number | null;
    spaceEquipements: { quantity: number; equipement: { id: string; name: string } }[];
  }): AdminSpaceListItem {
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
      equipements: space.spaceEquipements.map((se) => ({
        id: se.equipement.id,
        name: se.equipement.name,
        quantity: se.quantity,
      })),
    };
  }
}
