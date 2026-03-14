import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards, NotFoundException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/infrastructure/jwt-auth.guard';
import { AdminGuard } from '../auth/infrastructure/admin.guard';
import { ListAdminSpacesUseCase } from './application/list-admin-spaces.use-case';
import { CreateSpaceUseCase } from './application/create-space.use-case';
import { UpdateSpaceUseCase } from './application/update-space.use-case';
import { DeleteSpaceUseCase } from './application/delete-space.use-case';
import { AttachEquipementToSpaceUseCase } from './application/attach-equipement-to-space.use-case';
import { DetachEquipementFromSpaceUseCase } from './application/detach-equipement-from-space.use-case';
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
  quantity?: number;
};

@Controller('admin/espaces')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminSpacesController {
  constructor(
    private readonly listAdminSpacesUseCase: ListAdminSpacesUseCase,
    private readonly createSpaceUseCase: CreateSpaceUseCase,
    private readonly updateSpaceUseCase: UpdateSpaceUseCase,
    private readonly deleteSpaceUseCase: DeleteSpaceUseCase,
    private readonly attachEquipementToSpaceUseCase: AttachEquipementToSpaceUseCase,
    private readonly detachEquipementFromSpaceUseCase: DetachEquipementFromSpaceUseCase,
  ) {}

  @Get()
  async list() {
    return this.listAdminSpacesUseCase.run();
  }

  @Post()
  async create(@Body() dto: CreateSpaceDto) {
    return this.createSpaceUseCase.run(dto);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateSpaceDto) {
    const result = await this.updateSpaceUseCase.run(id, dto);
    if (!result) {
      throw new NotFoundException('Espace non trouvé');
    }
    return result;
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.deleteSpaceUseCase.run(id);
  }

  @Post(':id/equipements')
  async attachEquipement(@Param('id') spaceId: string, @Body() body: AttachEquipementDto) {
    return this.attachEquipementToSpaceUseCase.run(spaceId, body.equipementId, body.quantity ?? 1);
  }

  @Delete(':id/equipements/:equipementId')
  async detachEquipement(
    @Param('id') spaceId: string,
    @Param('equipementId') equipementId: string,
    @Query('quantity') quantity?: string,
  ) {
    const qty = quantity != null ? parseInt(quantity, 10) : undefined;
    return this.detachEquipementFromSpaceUseCase.run(spaceId, equipementId, Number.isNaN(qty) ? undefined : qty);
  }
}
