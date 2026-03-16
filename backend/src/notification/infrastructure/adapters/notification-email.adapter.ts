import { Injectable } from '@nestjs/common';
import { EmailService } from '../email.service';
import type { INotificationEmailSender } from '../../application/ports/notification-email-sender.port';
import type { ReservationNotificationPayload } from '../../domain/entities/reservation-notification.payload';

@Injectable()
export class NotificationEmailAdapter implements INotificationEmailSender {
  constructor(private readonly emailService: EmailService) {}

  async sendRegistrationApproved(to: string): Promise<void> {
    await this.emailService.sendRegistrationApprovedEmail(to);
  }

  async sendRegistrationRejected(to: string): Promise<void> {
    await this.emailService.sendRegistrationRejectedEmail(to);
  }

  async sendReservationConfirmation(
    to: string,
    payload: ReservationNotificationPayload,
  ): Promise<void> {
    await this.emailService.sendReservationConfirmationEmail(to, {
      spaceName: payload.spaceName,
      startDatetime: payload.startDatetime,
      endDatetime: payload.endDatetime,
      title: payload.title,
    });
  }

  async sendReservationReminder24h(
    to: string,
    payload: ReservationNotificationPayload,
  ): Promise<void> {
    await this.emailService.sendReservationReminder24hEmail(to, {
      spaceName: payload.spaceName,
      startDatetime: payload.startDatetime,
      endDatetime: payload.endDatetime,
      title: payload.title,
    });
  }

  async sendReservationCancelled(
    to: string,
    payload: ReservationNotificationPayload,
  ): Promise<void> {
    await this.emailService.sendReservationCancelledEmail(to, {
      spaceName: payload.spaceName,
      startDatetime: payload.startDatetime,
      endDatetime: payload.endDatetime,
      title: payload.title,
    });
  }

  async sendReservationModified(
    to: string,
    payload: ReservationNotificationPayload,
  ): Promise<void> {
    await this.emailService.sendReservationModifiedEmail(to, {
      spaceName: payload.spaceName,
      startDatetime: payload.startDatetime,
      endDatetime: payload.endDatetime,
      title: payload.title,
    });
  }
}
