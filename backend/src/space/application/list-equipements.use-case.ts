import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export type EquipementItem = { id: string; name: string };

@Injectable()
export class ListEquipementsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async run(): Promise<EquipementItem[]> {
    const list = await this.prisma.equipement.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    });
    return list;
  }
}
