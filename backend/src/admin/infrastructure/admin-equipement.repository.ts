import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import type {
  IAdminEquipementRepository,
  EquipementListItem,
  CreateEquipementInput,
  UpdateEquipementInput,
} from '../domain/admin-equipement.repository.interface';

@Injectable()
export class AdminEquipementRepository implements IAdminEquipementRepository {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<EquipementListItem[]> {
    const equipements = await this.prisma.equipement.findMany({
      orderBy: { name: 'asc' },
      include: {
        spaceEquipements: { select: { quantity: true } },
      },
    });
    return equipements.map((e) => {
      const assigned = e.spaceEquipements.reduce((sum, se) => sum + se.quantity, 0);
      return {
        id: e.id,
        name: e.name,
        quantity: e.quantity,
        assigned,
        available: Math.max(0, e.quantity - assigned),
      };
    });
  }

  async create(input: CreateEquipementInput): Promise<EquipementListItem> {
    const equipement = await this.prisma.equipement.create({
      data: {
        name: input.name,
        quantity: input.quantity ?? 1,
      },
      select: { id: true, name: true, quantity: true },
    });
    return equipement;
  }

  async update(id: string, input: UpdateEquipementInput): Promise<EquipementListItem | null> {
    try {
      const equipement = await this.prisma.equipement.update({
        where: { id },
        data: {
          ...(input.name !== undefined && { name: input.name }),
          ...(input.quantity !== undefined && { quantity: input.quantity }),
        },
        select: { id: true, name: true, quantity: true },
      });
      return equipement;
    } catch {
      return null;
    }
  }

  async getById(id: string): Promise<EquipementListItem | null> {
    const e = await this.prisma.equipement.findUnique({
      where: { id },
      select: { id: true, name: true, quantity: true },
    });
    return e;
  }

  async getAssignedQuantity(equipementId: string): Promise<number> {
    const result = await this.prisma.spaceEquipement.aggregate({
      where: { equipementId },
      _sum: { quantity: true },
    });
    return result._sum.quantity ?? 0;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.prisma.equipement.deleteMany({ where: { id } });
    return result.count > 0;
  }
}
