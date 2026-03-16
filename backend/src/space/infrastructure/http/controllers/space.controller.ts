import { Controller, Get, Param, Query } from '@nestjs/common';
import { ListSpacesUseCase } from '../../../application/use-cases/list-spaces.use-case';
import { GetSpaceByIdUseCase } from '../../../application/use-cases/get-space-by-id.use-case';
import { ListSeatsBySpaceUseCase } from '../../../application/use-cases/list-seats-by-space.use-case';
import { ListEquipementsUseCase } from '../../../application/use-cases/list-equipements.use-case';
import type { ListSpacesQueryDto } from '../../../application/dtos/list-spaces-query.dto';
import type { SpaceListFilters } from '../../../domain/filters/space-list.filters';
import { SPACE_PREFIX, SPACE_ROUTES } from '../routes/space.routes';
import { mapSpaceDomainErrorToHttp } from '../middlewares/space-error-mapper';

@Controller(SPACE_PREFIX)
export class SpaceController {
  constructor(
    private readonly listSpacesUseCase: ListSpacesUseCase,
    private readonly getSpaceByIdUseCase: GetSpaceByIdUseCase,
    private readonly listSeatsBySpaceUseCase: ListSeatsBySpaceUseCase,
    private readonly listEquipementsUseCase: ListEquipementsUseCase,
  ) {}

  @Get(SPACE_ROUTES.EQUIPMENTS)
  async listEquipments() {
    return this.listEquipementsUseCase.run();
  }

  @Get(SPACE_ROUTES.LIST)
  async list(@Query() query: ListSpacesQueryDto) {
    const filters: SpaceListFilters = {
      ...(query.type && { type: query.type }),
      ...(query.name && query.name.trim() && { name: query.name.trim() }),
      ...(query.equipementId && { equipementId: query.equipementId }),
      ...(query.capacityMin != null && query.capacityMin !== '' && { capacityMin: parseInt(query.capacityMin, 10) }),
      ...(query.capacityMax != null && query.capacityMax !== '' && { capacityMax: parseInt(query.capacityMax, 10) }),
    };
    return this.listSpacesUseCase.run(filters);
  }

  @Get(SPACE_ROUTES.SEATS)
  async listSeatsBySpace(@Param('id') id: string) {
    try {
      return await this.listSeatsBySpaceUseCase.run(id);
    } catch (err) {
      mapSpaceDomainErrorToHttp(err);
    }
  }

  @Get(SPACE_ROUTES.BY_ID)
  async getById(@Param('id') id: string) {
    try {
      return await this.getSpaceByIdUseCase.run(id);
    } catch (err) {
      mapSpaceDomainErrorToHttp(err);
    }
  }
}
