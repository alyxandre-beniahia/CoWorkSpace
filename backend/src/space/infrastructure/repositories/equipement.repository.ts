import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import type { IEquipementLister, EquipementItem } from '../../application/ports/equipement-lister.port';

@Injectable()
export class EquipementRepository implements IEquipementLister {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<EquipementItem[]> {
    const list = await this.prisma.equipement.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    });
    return list;
  }
}
