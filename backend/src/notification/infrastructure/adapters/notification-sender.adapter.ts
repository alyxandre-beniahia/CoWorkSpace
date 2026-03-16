import { Injectable } from '@nestjs/common';
import type { INotificationSender } from '../../application/ports/notification-sender.port';
import type { ReservationNotificationPayload } from '../../domain/entities/reservation-notification.payload';
import { SendRegistrationApprovedUseCase } from '../../application/use-cases/send-registration-approved.use-case';
import { SendRegistrationRejectedUseCase } from '../../application/use-cases/send-registration-rejected.use-case';
import { SendReservationConfirmationUseCase } from '../../application/use-cases/send-reservation-confirmation.use-case';
import { SendReservationReminder24hUseCase } from '../../application/use-cases/send-reservation-reminder24h.use-case';
import { SendReservationCancelledUseCase } from '../../application/use-cases/send-reservation-cancelled.use-case';
import { SendReservationModifiedUseCase } from '../../application/use-cases/send-reservation-modified.use-case';

@Injectable()
export class NotificationSenderAdapter implements INotificationSender {
  constructor(
    private readonly sendRegistrationApprovedUseCase: SendRegistrationApprovedUseCase,
    private readonly sendRegistrationRejectedUseCase: SendRegistrationRejectedUseCase,
    private readonly sendReservationConfirmationUseCase: SendReservationConfirmationUseCase,
    private readonly sendReservationReminder24hUseCase: SendReservationReminder24hUseCase,
    private readonly sendReservationCancelledUseCase: SendReservationCancelledUseCase,
    private readonly sendReservationModifiedUseCase: SendReservationModifiedUseCase,
  ) {}

  async sendRegistrationApproved(email: string, userId: string): Promise<void> {
    await this.sendRegistrationApprovedUseCase.run(email, userId);
  }

  async sendRegistrationRejected(email: string, userId: string): Promise<void> {
    await this.sendRegistrationRejectedUseCase.run(email, userId);
  }

  async sendReservationConfirmation(
    payload: ReservationNotificationPayload,
  ): Promise<void> {
    await this.sendReservationConfirmationUseCase.run(payload);
  }

  async sendReservationReminder24h(
    payload: ReservationNotificationPayload,
  ): Promise<void> {
    await this.sendReservationReminder24hUseCase.run(payload);
  }

  async sendReservationCancelled(
    payload: ReservationNotificationPayload,
  ): Promise<void> {
    await this.sendReservationCancelledUseCase.run(payload);
  }

  async sendReservationModified(
    payload: ReservationNotificationPayload,
  ): Promise<void> {
    await this.sendReservationModifiedUseCase.run(payload);
  }
}
