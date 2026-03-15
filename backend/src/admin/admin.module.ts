import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { NotificationModule } from '../notification/notification.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminController } from './admin.controller';
import { AdminSpacesController } from './admin-spaces.controller';
import { AdminEquipementsController } from './admin-equipements.controller';
import { AdminDashboardController } from './admin-dashboard.controller';
import { ListMembersUseCase } from './application/list-members.use-case';
import { ValidateRegistrationUseCase } from './application/validate-registration.use-case';
import { RejectRegistrationUseCase } from './application/reject-registration.use-case';
import { SetMemberActiveUseCase } from './application/set-member-active.use-case';
import { ListAdminSpacesUseCase } from './application/list-admin-spaces.use-case';
import { CreateSpaceUseCase } from './application/create-space.use-case';
import { UpdateSpaceUseCase } from './application/update-space.use-case';
import { DeleteSpaceUseCase } from './application/delete-space.use-case';
import { AttachEquipementToSpaceUseCase } from './application/attach-equipement-to-space.use-case';
import { DetachEquipementFromSpaceUseCase } from './application/detach-equipement-from-space.use-case';
import { ListEquipementsUseCase } from './application/list-equipements.use-case';
import { CreateEquipementUseCase } from './application/create-equipement.use-case';
import { UpdateEquipementUseCase } from './application/update-equipement.use-case';
import { DeleteEquipementUseCase } from './application/delete-equipement.use-case';
import { GetEquipementAvailabilityUseCase } from './application/get-equipement-availability.use-case';
import { GetDashboardStatsUseCase } from './application/get-dashboard-stats.use-case';
import { GetActivityUseCase } from './application/get-activity.use-case';
import { AdminSpaceRepository } from './infrastructure/admin-space.repository';
import { AdminEquipementRepository } from './infrastructure/admin-equipement.repository';

@Module({
  imports: [AuthModule, NotificationModule, PrismaModule],
  controllers: [AdminController, AdminSpacesController, AdminEquipementsController, AdminDashboardController],
  providers: [
    ListMembersUseCase,
    ValidateRegistrationUseCase,
    RejectRegistrationUseCase,
    SetMemberActiveUseCase,
    AdminSpaceRepository,
    AdminEquipementRepository,
    ListAdminSpacesUseCase,
    CreateSpaceUseCase,
    UpdateSpaceUseCase,
    DeleteSpaceUseCase,
    AttachEquipementToSpaceUseCase,
    DetachEquipementFromSpaceUseCase,
    ListEquipementsUseCase,
    CreateEquipementUseCase,
    UpdateEquipementUseCase,
    DeleteEquipementUseCase,
    GetEquipementAvailabilityUseCase,
    GetDashboardStatsUseCase,
    GetActivityUseCase,
  ],
})
export class AdminModule {}
