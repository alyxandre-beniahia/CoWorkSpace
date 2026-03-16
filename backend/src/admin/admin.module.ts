import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { NotificationModule } from '../notification/notification.module';
import { NOTIFICATION_SENDER } from '../notification/application/ports/notification-sender.port';
import type { INotificationSender } from '../notification/application/ports/notification-sender.port';
import { PrismaModule } from '../database/prisma.module';
import { PrismaService } from '../database/prisma.service';
import { AdminMembresController } from './infrastructure/http/controllers/admin-membres.controller';
import { AdminEspacesController } from './infrastructure/http/controllers/admin-espaces.controller';
import { AdminEquipementsController } from './infrastructure/http/controllers/admin-equipements.controller';
import { AdminDashboardController } from './infrastructure/http/controllers/admin-dashboard.controller';
import { AdminSpaceRepository } from './infrastructure/repositories/admin-space.repository';
import { AdminEquipementRepository } from './infrastructure/repositories/admin-equipement.repository';
import { AdminMemberRepository } from './infrastructure/repositories/admin-member.repository';
import { AdminStatsRepository } from './infrastructure/repositories/admin-stats.repository';
import { DashboardTimeRangesAdapter } from './infrastructure/adapters/dashboard-time-ranges.adapter';
import { ADMIN_SPACE_REPOSITORY } from './domain/repositories/admin-space.repository.interface';
import { ADMIN_EQUIPEMENT_REPOSITORY } from './domain/repositories/admin-equipement.repository.interface';
import { ADMIN_MEMBER_REPOSITORY } from './domain/repositories/admin-member.repository.interface';
import { ADMIN_STATS_REPOSITORY } from './domain/repositories/admin-stats.repository.interface';
import { ADMIN_DASHBOARD_TIME_RANGES } from './application/ports/dashboard-time-ranges.port';
import type { IAdminSpaceRepository } from './domain/repositories/admin-space.repository.interface';
import type { IAdminEquipementRepository } from './domain/repositories/admin-equipement.repository.interface';
import type { IAdminMemberRepository } from './domain/repositories/admin-member.repository.interface';
import type { IAdminStatsRepository } from './domain/repositories/admin-stats.repository.interface';
import type { IAdminDashboardTimeRanges } from './application/ports/dashboard-time-ranges.port';
import { ListMembersUseCase } from './application/use-cases/list-members.use-case';
import { ValidateRegistrationUseCase } from './application/use-cases/validate-registration.use-case';
import { RejectRegistrationUseCase } from './application/use-cases/reject-registration.use-case';
import { SetMemberActiveUseCase } from './application/use-cases/set-member-active.use-case';
import { ListAdminSpacesUseCase } from './application/use-cases/list-admin-spaces.use-case';
import { CreateSpaceUseCase } from './application/use-cases/create-space.use-case';
import { UpdateSpaceUseCase } from './application/use-cases/update-space.use-case';
import { DeleteSpaceUseCase } from './application/use-cases/delete-space.use-case';
import { AttachEquipementToSpaceUseCase } from './application/use-cases/attach-equipement-to-space.use-case';
import { DetachEquipementFromSpaceUseCase } from './application/use-cases/detach-equipement-from-space.use-case';
import { ListEquipementsUseCase } from './application/use-cases/list-equipements.use-case';
import { CreateEquipementUseCase } from './application/use-cases/create-equipement.use-case';
import { UpdateEquipementUseCase } from './application/use-cases/update-equipement.use-case';
import { DeleteEquipementUseCase } from './application/use-cases/delete-equipement.use-case';
import { GetEquipementAvailabilityUseCase } from './application/use-cases/get-equipement-availability.use-case';
import { GetDashboardStatsUseCase } from './application/use-cases/get-dashboard-stats.use-case';
import { GetActivityUseCase } from './application/use-cases/get-activity.use-case';

@Module({
  imports: [AuthModule, NotificationModule, PrismaModule],
  controllers: [
    AdminMembresController,
    AdminEspacesController,
    AdminEquipementsController,
    AdminDashboardController,
  ],
  providers: [
    { provide: ADMIN_SPACE_REPOSITORY, useClass: AdminSpaceRepository },
    { provide: ADMIN_EQUIPEMENT_REPOSITORY, useClass: AdminEquipementRepository },
    { provide: ADMIN_MEMBER_REPOSITORY, useClass: AdminMemberRepository },
    {
      provide: ADMIN_DASHBOARD_TIME_RANGES,
      useClass: DashboardTimeRangesAdapter,
    },
    {
      provide: ADMIN_STATS_REPOSITORY,
      useFactory: (
        prisma: PrismaService,
        timeRanges: IAdminDashboardTimeRanges,
      ) => new AdminStatsRepository(prisma, timeRanges),
      inject: [PrismaService, ADMIN_DASHBOARD_TIME_RANGES],
    },
    {
      provide: ListMembersUseCase,
      useFactory: (r: IAdminMemberRepository) => new ListMembersUseCase(r),
      inject: [ADMIN_MEMBER_REPOSITORY],
    },
    {
      provide: ValidateRegistrationUseCase,
      useFactory: (r: IAdminMemberRepository, notificationSender: INotificationSender) =>
        new ValidateRegistrationUseCase(r, notificationSender),
      inject: [ADMIN_MEMBER_REPOSITORY, NOTIFICATION_SENDER],
    },
    {
      provide: RejectRegistrationUseCase,
      useFactory: (r: IAdminMemberRepository, notificationSender: INotificationSender) =>
        new RejectRegistrationUseCase(r, notificationSender),
      inject: [ADMIN_MEMBER_REPOSITORY, NOTIFICATION_SENDER],
    },
    {
      provide: SetMemberActiveUseCase,
      useFactory: (r: IAdminMemberRepository) => new SetMemberActiveUseCase(r),
      inject: [ADMIN_MEMBER_REPOSITORY],
    },
    {
      provide: ListAdminSpacesUseCase,
      useFactory: (r: IAdminSpaceRepository) => new ListAdminSpacesUseCase(r),
      inject: [ADMIN_SPACE_REPOSITORY],
    },
    {
      provide: CreateSpaceUseCase,
      useFactory: (r: IAdminSpaceRepository) => new CreateSpaceUseCase(r),
      inject: [ADMIN_SPACE_REPOSITORY],
    },
    {
      provide: UpdateSpaceUseCase,
      useFactory: (r: IAdminSpaceRepository) => new UpdateSpaceUseCase(r),
      inject: [ADMIN_SPACE_REPOSITORY],
    },
    {
      provide: DeleteSpaceUseCase,
      useFactory: (r: IAdminSpaceRepository) => new DeleteSpaceUseCase(r),
      inject: [ADMIN_SPACE_REPOSITORY],
    },
    {
      provide: AttachEquipementToSpaceUseCase,
      useFactory: (r: IAdminSpaceRepository) => new AttachEquipementToSpaceUseCase(r),
      inject: [ADMIN_SPACE_REPOSITORY],
    },
    {
      provide: DetachEquipementFromSpaceUseCase,
      useFactory: (r: IAdminSpaceRepository) => new DetachEquipementFromSpaceUseCase(r),
      inject: [ADMIN_SPACE_REPOSITORY],
    },
    {
      provide: ListEquipementsUseCase,
      useFactory: (r: IAdminEquipementRepository) => new ListEquipementsUseCase(r),
      inject: [ADMIN_EQUIPEMENT_REPOSITORY],
    },
    {
      provide: CreateEquipementUseCase,
      useFactory: (r: IAdminEquipementRepository) => new CreateEquipementUseCase(r),
      inject: [ADMIN_EQUIPEMENT_REPOSITORY],
    },
    {
      provide: UpdateEquipementUseCase,
      useFactory: (r: IAdminEquipementRepository) => new UpdateEquipementUseCase(r),
      inject: [ADMIN_EQUIPEMENT_REPOSITORY],
    },
    {
      provide: DeleteEquipementUseCase,
      useFactory: (r: IAdminEquipementRepository) => new DeleteEquipementUseCase(r),
      inject: [ADMIN_EQUIPEMENT_REPOSITORY],
    },
    {
      provide: GetEquipementAvailabilityUseCase,
      useFactory: (r: IAdminEquipementRepository) => new GetEquipementAvailabilityUseCase(r),
      inject: [ADMIN_EQUIPEMENT_REPOSITORY],
    },
    {
      provide: GetDashboardStatsUseCase,
      useFactory: (r: IAdminStatsRepository) => new GetDashboardStatsUseCase(r),
      inject: [ADMIN_STATS_REPOSITORY],
    },
    {
      provide: GetActivityUseCase,
      useFactory: (r: IAdminStatsRepository) => new GetActivityUseCase(r),
      inject: [ADMIN_STATS_REPOSITORY],
    },
  ],
})
export class AdminModule {}
