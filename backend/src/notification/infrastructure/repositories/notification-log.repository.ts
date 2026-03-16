import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import type {
  INotificationLogRepository,
  CreateNotificationLogInput,
  NotificationLogType,
} from '../../domain/repositories/notification-log.repository.interface';

// On garde un mapping centralisé, typé sur le domaine uniquement.
const TYPE_MAP: Record<NotificationLogType, string> = {
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
        // Cast léger : les valeurs sont alignées sur l'enum Prisma côté BDD.
        type: TYPE_MAP[data.type] as any,
        userId: data.userId,
        reservationId: data.reservationId ?? undefined,
      },
    });
  }
}
