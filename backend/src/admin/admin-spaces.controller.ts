import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/infrastructure/jwt-auth.guard';
import { AdminGuard } from '../auth/infrastructure/admin.guard';
import { PrismaService } from '../prisma/prisma.service';
import { SpaceType, SpaceStatus } from '@prisma/client';

type CreateSpaceDto = {
  name: string;
  code?: string | null;
  type: SpaceType;
  capacity: number;
  description?: string | null;
  positionX?: number | null;
  positionY?: number | null;
};

type UpdateSpaceDto = Partial<CreateSpaceDto> & {
  status?: SpaceStatus;
};

type AttachEquipementDto = {
  equipementId: string;
};

@Controller('admin/espaces')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminSpacesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list() {
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
      equipements: s.spaceEquipements.map((se) => ({ id: se.equipement.id, name: se.equipement.name })),
    }));
  }

  @Post()
  async create(@Body() dto: CreateSpaceDto) {
    const space = await this.prisma.space.create({
      data: {
        name: dto.name,
        code: dto.code ?? null,
        type: dto.type,
        capacity: dto.capacity,
        description: dto.description ?? null,
        positionX: dto.positionX ?? null,
        positionY: dto.positionY ?? null,
      },
    });
    return space;
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateSpaceDto) {
    const space = await this.prisma.space.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.code !== undefined && { code: dto.code }),
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.capacity !== undefined && { capacity: dto.capacity }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.positionX !== undefined && { positionX: dto.positionX }),
        ...(dto.positionY !== undefined && { positionY: dto.positionY }),
        ...(dto.status !== undefined && { status: dto.status }),
      },
    });
    return space;
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.prisma.space.delete({ where: { id } });
    return { deleted: true };
  }

  @Post(':id/equipements')
  async attachEquipement(@Param('id') spaceId: string, @Body() body: AttachEquipementDto) {
    const link = await this.prisma.spaceEquipement.create({
      data: {
        spaceId,
        equipementId: body.equipementId,
      },
    });
    return link;
  }

  @Delete(':id/equipements/:equipementId')
  async detachEquipement(@Param('id') spaceId: string, @Param('equipementId') equipementId: string) {
    await this.prisma.spaceEquipement.deleteMany({
      where: { spaceId, equipementId },
    });
    return { deleted: true };
  }
}

