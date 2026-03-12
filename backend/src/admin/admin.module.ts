import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { NotificationModule } from '../notification/notification.module';
import { AdminController } from './admin.controller';
import { ListMembersUseCase } from './application/list-members.use-case';
import { ValidateRegistrationUseCase } from './application/validate-registration.use-case';
import { RejectRegistrationUseCase } from './application/reject-registration.use-case';
import { SetMemberActiveUseCase } from './application/set-member-active.use-case';

@Module({
  imports: [AuthModule, NotificationModule],
  controllers: [AdminController],
  providers: [
    ListMembersUseCase,
    ValidateRegistrationUseCase,
    RejectRegistrationUseCase,
    SetMemberActiveUseCase,
  ],
})
export class AdminModule {}
