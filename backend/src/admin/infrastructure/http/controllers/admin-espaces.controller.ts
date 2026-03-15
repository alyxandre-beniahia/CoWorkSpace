import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { AdminGuard } from '../../../../shared/guards/admin.guard';
import { ListAdminSpacesUseCase } from '../../../application/use-cases/list-admin-spaces.use-case';
import { CreateSpaceUseCase } from '../../../application/use-cases/create-space.use-case';
import { UpdateSpaceUseCase } from '../../../application/use-cases/update-space.use-case';
import { DeleteSpaceUseCase } from '../../../application/use-cases/delete-space.use-case';
import { AttachEquipementToSpaceUseCase } from '../../../application/use-cases/attach-equipement-to-space.use-case';
import { DetachEquipementFromSpaceUseCase } from '../../../application/use-cases/detach-equipement-from-space.use-case';
import type { CreateSpaceDto } from '../../../application/dtos/create-space.dto';
import type { UpdateSpaceDto } from '../../../application/dtos/update-space.dto';
import type { AttachEquipementToSpaceDto } from '../../../application/dtos/attach-equipement-to-space.dto';
import { AdminNotFoundError } from '../../../domain/errors/admin.errors';
import { ADMIN_PREFIX_ESPACES, ADMIN_ROUTES_ESPACES } from '../routes/admin.routes';
import { mapAdminDomainErrorToHttp } from '../middlewares/admin-error-mapper';

@Controller(ADMIN_PREFIX_ESPACES)
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminEspacesController {
  constructor(
    private readonly listAdminSpacesUseCase: ListAdminSpacesUseCase,
    private readonly createSpaceUseCase: CreateSpaceUseCase,
    private readonly updateSpaceUseCase: UpdateSpaceUseCase,
    private readonly deleteSpaceUseCase: DeleteSpaceUseCase,
    private readonly attachEquipementToSpaceUseCase: AttachEquipementToSpaceUseCase,
    private readonly detachEquipementFromSpaceUseCase: DetachEquipementFromSpaceUseCase,
  ) {}

  @Get(ADMIN_ROUTES_ESPACES.LIST)
  async list() {
    return this.listAdminSpacesUseCase.run();
  }

  @Post(ADMIN_ROUTES_ESPACES.LIST)
  async create(@Body() dto: CreateSpaceDto) {
    return this.createSpaceUseCase.run(dto);
  }

  @Patch(ADMIN_ROUTES_ESPACES.BY_ID)
  async update(@Param('id') id: string, @Body() dto: UpdateSpaceDto) {
    try {
      const result = await this.updateSpaceUseCase.run(id, dto);
      if (!result) {
        mapAdminDomainErrorToHttp(new AdminNotFoundError('Espace non trouvé'));
      }
      return result;
    } catch (err) {
      mapAdminDomainErrorToHttp(err);
    }
  }

  @Delete(ADMIN_ROUTES_ESPACES.BY_ID)
  async remove(@Param('id') id: string) {
    try {
      return await this.deleteSpaceUseCase.run(id);
    } catch (err) {
      mapAdminDomainErrorToHttp(err);
    }
  }

  @Post(ADMIN_ROUTES_ESPACES.ATTACH_EQUIPEMENT)
  async attachEquipement(@Param('id') spaceId: string, @Body() body: AttachEquipementToSpaceDto) {
    try {
      return await this.attachEquipementToSpaceUseCase.run(
        spaceId,
        body.equipementId,
        body.quantity ?? 1,
      );
    } catch (err) {
      mapAdminDomainErrorToHttp(err);
    }
  }

  @Delete(ADMIN_ROUTES_ESPACES.DETACH_EQUIPEMENT)
  async detachEquipement(
    @Param('id') spaceId: string,
    @Param('equipementId') equipementId: string,
    @Query('quantity') quantity?: string,
  ) {
    const qty = quantity != null ? parseInt(quantity, 10) : undefined;
    return this.detachEquipementFromSpaceUseCase.run(
      spaceId,
      equipementId,
      Number.isNaN(qty) ? undefined : qty,
    );
  }
}
