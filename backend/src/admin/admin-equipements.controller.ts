import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards, NotFoundException } from '@nestjs/common';
import { JwtAuthGuard } from '../shared/guards/jwt-auth.guard';
import { AdminGuard } from '../shared/guards/admin.guard';
import { ListEquipementsUseCase } from './application/list-equipements.use-case';
import { CreateEquipementUseCase } from './application/create-equipement.use-case';
import { UpdateEquipementUseCase } from './application/update-equipement.use-case';
import { DeleteEquipementUseCase } from './application/delete-equipement.use-case';
import { GetEquipementAvailabilityUseCase } from './application/get-equipement-availability.use-case';

type CreateEquipementDto = {
  name: string;
  quantity?: number;
};

type UpdateEquipementDto = {
  name?: string;
  quantity?: number;
};

@Controller('admin/equipements')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminEquipementsController {
  constructor(
    private readonly listEquipementsUseCase: ListEquipementsUseCase,
    private readonly createEquipementUseCase: CreateEquipementUseCase,
    private readonly updateEquipementUseCase: UpdateEquipementUseCase,
    private readonly deleteEquipementUseCase: DeleteEquipementUseCase,
    private readonly getEquipementAvailabilityUseCase: GetEquipementAvailabilityUseCase,
  ) {}

  @Get()
  async list() {
    return this.listEquipementsUseCase.run();
  }

  @Get(':id/availability')
  async getAvailability(@Param('id') id: string) {
    return this.getEquipementAvailabilityUseCase.run(id);
  }

  @Post()
  async create(@Body() dto: CreateEquipementDto) {
    return this.createEquipementUseCase.run(dto);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateEquipementDto) {
    const result = await this.updateEquipementUseCase.run(id, dto);
    if (!result) {
      throw new NotFoundException('Équipement non trouvé');
    }
    return result;
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.deleteEquipementUseCase.run(id);
  }
}
