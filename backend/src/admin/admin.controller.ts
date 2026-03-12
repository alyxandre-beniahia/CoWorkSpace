import { Controller, Get, Patch, Param, Query, UseGuards, Request } from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '../auth/infrastructure/jwt-auth.guard';
import { AdminGuard } from '../auth/infrastructure/admin.guard';
import { ListMembersUseCase, type ListMembersFilter } from './application/list-members.use-case';
import { ValidateRegistrationUseCase } from './application/validate-registration.use-case';
import { RejectRegistrationUseCase } from './application/reject-registration.use-case';
import { SetMemberActiveUseCase } from './application/set-member-active.use-case';

type AuthRequest = ExpressRequest & { user: { userId: string; email: string; role: string } };

@Controller('admin/membres')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(
    private readonly listMembersUseCase: ListMembersUseCase,
    private readonly validateRegistrationUseCase: ValidateRegistrationUseCase,
    private readonly rejectRegistrationUseCase: RejectRegistrationUseCase,
    private readonly setMemberActiveUseCase: SetMemberActiveUseCase,
  ) {}

  @Get()
  async list(
    @Query('filter') filter: ListMembersFilter = 'all',
    @Request() _req: AuthRequest,
  ) {
    return this.listMembersUseCase.run(filter);
  }

  @Patch(':id/valider')
  async validateRegistration(@Param('id') userId: string, @Request() req: AuthRequest) {
    return this.validateRegistrationUseCase.run(userId, req.user.userId);
  }

  @Patch(':id/refuser')
  async rejectRegistration(@Param('id') userId: string) {
    return this.rejectRegistrationUseCase.run(userId);
  }

  @Patch(':id/actif')
  async setActive(
    @Param('id') userId: string,
    @Query('actif') actif: string,
    @Request() _req: AuthRequest,
  ) {
    const isActive = actif === 'true' || actif === '1';
    return this.setMemberActiveUseCase.run(userId, isActive);
  }
}
