import { Controller, Get, Patch, Param, Query, UseGuards, Request } from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { AdminGuard } from '../../../../shared/guards/admin.guard';
import { ListMembersUseCase } from '../../../application/use-cases/list-members.use-case';
import { ValidateRegistrationUseCase } from '../../../application/use-cases/validate-registration.use-case';
import { RejectRegistrationUseCase } from '../../../application/use-cases/reject-registration.use-case';
import { SetMemberActiveUseCase } from '../../../application/use-cases/set-member-active.use-case';
import type { ListMembersQueryDto } from '../../../application/dtos/list-members-query.dto';
import { ADMIN_PREFIX_MEMBRES, ADMIN_ROUTES_MEMBRES } from '../routes/admin.routes';
import { mapAdminDomainErrorToHttp } from '../middlewares/admin-error-mapper';

type AuthRequest = ExpressRequest & { user: { userId: string; email: string; role: string } };

@Controller(ADMIN_PREFIX_MEMBRES)
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminMembresController {
  constructor(
    private readonly listMembersUseCase: ListMembersUseCase,
    private readonly validateRegistrationUseCase: ValidateRegistrationUseCase,
    private readonly rejectRegistrationUseCase: RejectRegistrationUseCase,
    private readonly setMemberActiveUseCase: SetMemberActiveUseCase,
  ) {}

  @Get(ADMIN_ROUTES_MEMBRES.LIST)
  async list(@Query() query: ListMembersQueryDto, @Request() _req: AuthRequest) {
    const filter = query.filter ?? 'all';
    return this.listMembersUseCase.run({ filter });
  }

  @Patch(ADMIN_ROUTES_MEMBRES.VALIDATE)
  async validateRegistration(@Param('id') userId: string, @Request() req: AuthRequest) {
    try {
      return await this.validateRegistrationUseCase.run(userId, req.user.userId);
    } catch (err) {
      mapAdminDomainErrorToHttp(err);
    }
  }

  @Patch(ADMIN_ROUTES_MEMBRES.REJECT)
  async rejectRegistration(@Param('id') userId: string) {
    try {
      return await this.rejectRegistrationUseCase.run(userId);
    } catch (err) {
      mapAdminDomainErrorToHttp(err);
    }
  }

  @Patch(ADMIN_ROUTES_MEMBRES.SET_ACTIVE)
  async setActive(
    @Param('id') userId: string,
    @Query('actif') actif: string,
    @Request() _req: AuthRequest,
  ) {
    try {
      const isActive = actif === 'true' || actif === '1';
      return await this.setMemberActiveUseCase.run(userId, isActive);
    } catch (err) {
      mapAdminDomainErrorToHttp(err);
    }
  }
}
