import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { AdminGuard } from '../../../../shared/guards/admin.guard';
import { ListEquipementsUseCase } from '../../../application/use-cases/list-equipements.use-case';
import { CreateEquipementUseCase } from '../../../application/use-cases/create-equipement.use-case';
import { UpdateEquipementUseCase } from '../../../application/use-cases/update-equipement.use-case';
import { DeleteEquipementUseCase } from '../../../application/use-cases/delete-equipement.use-case';
import { GetEquipementAvailabilityUseCase } from '../../../application/use-cases/get-equipement-availability.use-case';
import type { CreateEquipementDto } from '../../../application/dtos/create-equipement.dto';
import type { UpdateEquipementDto } from '../../../application/dtos/update-equipement.dto';
import { AdminNotFoundError } from '../../../domain/errors/admin.errors';
import { ADMIN_PREFIX_EQUIPEMENTS, ADMIN_ROUTES_EQUIPEMENTS } from '../routes/admin.routes';
import { mapAdminDomainErrorToHttp } from '../middlewares/admin-error-mapper';

@Controller(ADMIN_PREFIX_EQUIPEMENTS)
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminEquipementsController {
  constructor(
    private readonly listEquipementsUseCase: ListEquipementsUseCase,
    private readonly createEquipementUseCase: CreateEquipementUseCase,
    private readonly updateEquipementUseCase: UpdateEquipementUseCase,
    private readonly deleteEquipementUseCase: DeleteEquipementUseCase,
    private readonly getEquipementAvailabilityUseCase: GetEquipementAvailabilityUseCase,
  ) {}

  @Get(ADMIN_ROUTES_EQUIPEMENTS.LIST)
  async list() {
    return this.listEquipementsUseCase.run();
  }

  @Get(ADMIN_ROUTES_EQUIPEMENTS.AVAILABILITY)
  async getAvailability(@Param('id') id: string) {
    try {
      return await this.getEquipementAvailabilityUseCase.run(id);
    } catch (err) {
      mapAdminDomainErrorToHttp(err);
    }
  }

  @Post(ADMIN_ROUTES_EQUIPEMENTS.LIST)
  async create(@Body() dto: CreateEquipementDto) {
    return this.createEquipementUseCase.run(dto);
  }

  @Patch(ADMIN_ROUTES_EQUIPEMENTS.BY_ID)
  async update(@Param('id') id: string, @Body() dto: UpdateEquipementDto) {
    try {
      const result = await this.updateEquipementUseCase.run(id, dto);
      if (!result) {
        mapAdminDomainErrorToHttp(new AdminNotFoundError('Équipement non trouvé'));
      }
      return result;
    } catch (err) {
      mapAdminDomainErrorToHttp(err);
    }
  }

  @Delete(ADMIN_ROUTES_EQUIPEMENTS.BY_ID)
  async remove(@Param('id') id: string) {
    try {
      return await this.deleteEquipementUseCase.run(id);
    } catch (err) {
      mapAdminDomainErrorToHttp(err);
    }
  }
}
