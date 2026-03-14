import { Controller, Get, Param, Query } from '@nestjs/common';
import { ListSpacesUseCase } from './application/list-spaces.use-case';
import { GetSpaceByIdUseCase } from './application/get-space-by-id.use-case';
import { ListSeatsBySpaceUseCase } from './application/list-seats-by-space.use-case';
import { ListEquipementsUseCase } from './application/list-equipements.use-case';
import { SpaceType } from '@prisma/client';

type QueryFilters = {
  type?: SpaceType;
  equipementId?: string;
  capacityMin?: string;
  capacityMax?: string;
};

@Controller('spaces')
export class SpaceController {
  constructor(
    private readonly listSpacesUseCase: ListSpacesUseCase,
    private readonly getSpaceByIdUseCase: GetSpaceByIdUseCase,
    private readonly listSeatsBySpaceUseCase: ListSeatsBySpaceUseCase,
    private readonly listEquipementsUseCase: ListEquipementsUseCase,
  ) {}

  @Get('equipments')
  async listEquipments() {
    return this.listEquipementsUseCase.run();
  }

  @Get()
  async list(@Query() query: QueryFilters) {
    const filters = {
      ...(query.type && { type: query.type }),
      ...(query.equipementId && { equipementId: query.equipementId }),
      ...(query.capacityMin != null && query.capacityMin !== '' && { capacityMin: parseInt(query.capacityMin, 10) }),
      ...(query.capacityMax != null && query.capacityMax !== '' && { capacityMax: parseInt(query.capacityMax, 10) }),
    };
    return this.listSpacesUseCase.run(filters);
  }

  @Get(':id/seats')
  async listSeatsBySpace(@Param('id') id: string) {
    return this.listSeatsBySpaceUseCase.run(id);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.getSpaceByIdUseCase.run(id);
  }
}
