import { Module, Global, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../database/prisma.module';
import { ReservationModule } from '../reservation/reservation.module';
import { EmailService } from './infrastructure/email.service';
import { ReminderSchedulerService } from './infrastructure/scheduler/reminder-scheduler.service';
import { NotificationLogRepository } from './infrastructure/repositories/notification-log.repository';
import { NotificationEmailAdapter } from './infrastructure/adapters/notification-email.adapter';
import { NotificationSenderAdapter } from './infrastructure/adapters/notification-sender.adapter';
import { NOTIFICATION_LOG_REPOSITORY } from './domain/repositories/notification-log.repository.interface';
import type { INotificationLogRepository } from './domain/repositories/notification-log.repository.interface';
import { NOTIFICATION_EMAIL_SENDER } from './application/ports/notification-email-sender.port';
import type { INotificationEmailSender } from './application/ports/notification-email-sender.port';
import { NOTIFICATION_SENDER } from './application/ports/notification-sender.port';
import type { INotificationSender } from './application/ports/notification-sender.port';
import { SendRegistrationApprovedUseCase } from './application/use-cases/send-registration-approved.use-case';
import { SendRegistrationRejectedUseCase } from './application/use-cases/send-registration-rejected.use-case';
import { SendReservationConfirmationUseCase } from './application/use-cases/send-reservation-confirmation.use-case';
import { SendReservationReminder24hUseCase } from './application/use-cases/send-reservation-reminder24h.use-case';
import { SendReservationCancelledUseCase } from './application/use-cases/send-reservation-cancelled.use-case';
import { SendReservationModifiedUseCase } from './application/use-cases/send-reservation-modified.use-case';
import { SendScheduledRemindersUseCase } from './application/use-cases/send-scheduled-reminders.use-case';
import { RESERVATIONS_FOR_REMINDER } from './application/ports/reservations-for-reminder.port';
import type { IReservationsForReminder } from './application/ports/reservations-for-reminder.port';

@Global()
@Module({
  imports: [PrismaModule, forwardRef(() => ReservationModule)],
  providers: [
    EmailService,
    {
      provide: NOTIFICATION_LOG_REPOSITORY,
      useClass: NotificationLogRepository,
    },
    {
      provide: NOTIFICATION_EMAIL_SENDER,
      useClass: NotificationEmailAdapter,
    },
    {
      provide: SendRegistrationApprovedUseCase,
      useFactory: (
        emailSender: INotificationEmailSender,
        logRepo: INotificationLogRepository,
      ) => new SendRegistrationApprovedUseCase(emailSender, logRepo),
      inject: [NOTIFICATION_EMAIL_SENDER, NOTIFICATION_LOG_REPOSITORY],
    },
    {
      provide: SendRegistrationRejectedUseCase,
      useFactory: (
        emailSender: INotificationEmailSender,
        logRepo: INotificationLogRepository,
      ) => new SendRegistrationRejectedUseCase(emailSender, logRepo),
      inject: [NOTIFICATION_EMAIL_SENDER, NOTIFICATION_LOG_REPOSITORY],
    },
    {
      provide: SendReservationConfirmationUseCase,
      useFactory: (
        emailSender: INotificationEmailSender,
        logRepo: INotificationLogRepository,
      ) => new SendReservationConfirmationUseCase(emailSender, logRepo),
      inject: [NOTIFICATION_EMAIL_SENDER, NOTIFICATION_LOG_REPOSITORY],
    },
    {
      provide: SendReservationReminder24hUseCase,
      useFactory: (
        emailSender: INotificationEmailSender,
        logRepo: INotificationLogRepository,
      ) => new SendReservationReminder24hUseCase(emailSender, logRepo),
      inject: [NOTIFICATION_EMAIL_SENDER, NOTIFICATION_LOG_REPOSITORY],
    },
    {
      provide: SendReservationCancelledUseCase,
      useFactory: (
        emailSender: INotificationEmailSender,
        logRepo: INotificationLogRepository,
      ) => new SendReservationCancelledUseCase(emailSender, logRepo),
      inject: [NOTIFICATION_EMAIL_SENDER, NOTIFICATION_LOG_REPOSITORY],
    },
    {
      provide: SendReservationModifiedUseCase,
      useFactory: (
        emailSender: INotificationEmailSender,
        logRepo: INotificationLogRepository,
      ) => new SendReservationModifiedUseCase(emailSender, logRepo),
      inject: [NOTIFICATION_EMAIL_SENDER, NOTIFICATION_LOG_REPOSITORY],
    },
    {
      provide: SendScheduledRemindersUseCase,
      useFactory: (
        reservationsForReminder: IReservationsForReminder,
        sendReminderUseCase: SendReservationReminder24hUseCase,
      ) =>
        new SendScheduledRemindersUseCase(
          reservationsForReminder,
          sendReminderUseCase,
        ),
      inject: [RESERVATIONS_FOR_REMINDER, SendReservationReminder24hUseCase],
    },
    ReminderSchedulerService,
    {
      provide: NOTIFICATION_SENDER,
      useClass: NotificationSenderAdapter,
    },
  ],
  exports: [EmailService, NOTIFICATION_SENDER],
})
export class NotificationModule {}
