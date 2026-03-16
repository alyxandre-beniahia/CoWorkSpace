import { Injectable } from '@nestjs/common';
import { NotificationType as PrismaNotificationType } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import type {
  INotificationLogRepository,
  CreateNotificationLogInput,
  NotificationLogType,
} from '../../domain/repositories/notification-log.repository.interface';

const TYPE_MAP: Record<NotificationLogType, PrismaNotificationType> = {
  SIGNUP_CONFIRMATION: 'SIGNUP_CONFIRMATION',
  REGISTRATION_APPROVED: 'REGISTRATION_APPROVED',
  REGISTRATION_REJECTED: 'REGISTRATION_REJECTED',
  RESERVATION_CONFIRMATION: 'RESERVATION_CONFIRMATION',
  RESERVATION_REMINDER_24H: 'RESERVATION_REMINDER_24H',
  RESERVATION_CANCELLED: 'RESERVATION_CANCELLED',
  RESERVATION_MODIFIED: 'RESERVATION_MODIFIED',
};

@Injectable()
export class NotificationLogRepository implements INotificationLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateNotificationLogInput): Promise<void> {
    await this.prisma.notificationLog.create({
      data: {
        type: TYPE_MAP[data.type],
        userId: data.userId,
        reservationId: data.reservationId ?? undefined,
      },
    });
  }
}
