import type { IReservationRepository } from '../../domain/repositories/reservation.repository.interface';
import type { UpdateReservationInput } from '../../domain/entities/reservation.entity';
import {
  ReservationNotFoundError,
  ReservationForbiddenError,
  ReservationConflictError,
  ReservationBadRequestError,
} from '../../domain/errors/reservation.errors';
import type { UpdateReservationDto } from '../dtos/update-reservation.dto';
import {
  isWithinReservationWindow,
  isStartInFuture,
  RESERVATION_WINDOW_MESSAGE,
  RESERVATION_FUTURE_MESSAGE,
} from '../utils/reservation-window.utils';
import type { INotificationSender } from '../../../notification/application/ports/notification-sender.port';
import type { ReservationNotificationPayload } from '../../../notification/domain/entities/reservation-notification.payload';

function toPayload(
  r: { id: string; userId: string; userEmail: string; spaceName: string; startDatetime: Date; endDatetime: Date; title: string | null },
): ReservationNotificationPayload {
  return {
    userId: r.userId,
    userEmail: r.userEmail,
    reservationId: r.id,
    spaceName: r.spaceName,
    startDatetime: r.startDatetime,
    endDatetime: r.endDatetime,
    title: r.title,
  };
}

export class UpdateReservationUseCase {
  constructor(
    private readonly reservationRepository: IReservationRepository,
    private readonly notificationSender: INotificationSender,
  ) {}

  async run(reservationId: string, userId: string, dto: UpdateReservationDto, role?: string) {
    const input: UpdateReservationInput = {
      ...(dto.seatId !== undefined && { seatId: dto.seatId ?? null }),
      ...(dto.startDatetime && { startDatetime: new Date(dto.startDatetime) }),
      ...(dto.endDatetime && { endDatetime: new Date(dto.endDatetime) }),
      ...(dto.title !== undefined && { title: dto.title }),
      ...(dto.isPrivate !== undefined && { isPrivate: dto.isPrivate }),
      ...(dto.recurrenceRule !== undefined && { recurrenceRule: dto.recurrenceRule }),
      ...(dto.recurrenceEndAt !== undefined && {
        recurrenceEndAt: dto.recurrenceEndAt ? new Date(dto.recurrenceEndAt) : null,
      }),
    };
    const existing = await this.reservationRepository.findById(reservationId, userId);
    if (!existing) {
      throw new ReservationNotFoundError('Réservation introuvable.');
    }
    const isAdmin = role === 'admin';
    if (!isAdmin && existing.userId !== userId) {
      throw new ReservationForbiddenError(
        'Vous ne pouvez modifier que vos propres réservations.',
      );
    }

    const start = input.startDatetime ?? existing.startDatetime;
    const end = input.endDatetime ?? existing.endDatetime;

    if (end <= start) {
      throw new ReservationConflictError('La date de fin doit être après la date de début.');
    }
    if (!isWithinReservationWindow(start, end)) {
      throw new ReservationBadRequestError(RESERVATION_WINDOW_MESSAGE);
    }
    if (!isStartInFuture(start)) {
      throw new ReservationBadRequestError(RESERVATION_FUTURE_MESSAGE);
    }

    const userOverlap = await this.reservationRepository.hasUserOverlap(
      existing.userId,
      start,
      end,
      reservationId,
    );
    if (userOverlap) {
      throw new ReservationConflictError(
        'Vous avez déjà une réservation sur ce créneau.',
      );
    }

    const effectiveSeatId = input.seatId !== undefined ? input.seatId : existing.seatId;
    const hasOverlap = await this.reservationRepository.hasOverlap(
      existing.spaceId,
      start,
      end,
      reservationId,
      effectiveSeatId ?? null,
    );

    if (hasOverlap) {
      throw new ReservationConflictError('Ce créneau chevauche une réservation existante.');
    }

    const updated = await this.reservationRepository.update(reservationId, input);
    if (updated) {
      await this.notificationSender.sendReservationModified(toPayload(updated));
    }
    return updated;
  }
}
