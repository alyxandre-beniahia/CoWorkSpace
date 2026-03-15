import type { IReservationRepository } from '../../domain/repositories/reservation.repository.interface';
import type { CreateReservationInput } from '../../domain/entities/reservation.entity';
import {
  ReservationForbiddenError,
  ReservationBadRequestError,
  ReservationConflictError,
} from '../../domain/errors/reservation.errors';
import type { IIdGenerator } from '../ports/id-generator.port';
import type { IRecurrenceExpander } from '../ports/recurrence-expander.port';
import type { CreateReservationDto } from '../dtos/create-reservation.dto';
import {
  isWithinReservationWindow,
  isStartInFuture,
  RESERVATION_WINDOW_MESSAGE,
  RESERVATION_FUTURE_MESSAGE,
} from '../utils/reservation-window.utils';

export class CreateReservationUseCase {
  constructor(
    private readonly reservationRepository: IReservationRepository,
    private readonly idGenerator: IIdGenerator,
    private readonly recurrenceExpander: IRecurrenceExpander,
  ) {}

  async run(userId: string, dto: CreateReservationDto, role?: string) {
    if (dto.userId != null && role !== 'admin') {
      throw new ReservationForbiddenError(
        'Seul un administrateur peut réserver pour un autre utilisateur.',
      );
    }
    const effectiveUserId = role === 'admin' && dto.userId ? dto.userId : userId;
    const start = new Date(dto.startDatetime);
    const end = new Date(dto.endDatetime);

    if (end <= start) {
      throw new ReservationBadRequestError('La date de fin doit être après la date de début.');
    }
    if (!isWithinReservationWindow(start, end)) {
      throw new ReservationBadRequestError(RESERVATION_WINDOW_MESSAGE);
    }
    if (!isStartInFuture(start)) {
      throw new ReservationBadRequestError(RESERVATION_FUTURE_MESSAGE);
    }

    const isRecurring = dto.recurrenceRule && dto.recurrenceEndAt;
    const recurrenceGroupId = isRecurring ? this.idGenerator.generate() : null;

    if (isRecurring) {
      const recurrenceEndAt = new Date(dto.recurrenceEndAt!);
      if (recurrenceEndAt <= start) {
        throw new ReservationBadRequestError(
          'La date de fin de récurrence doit être après la date de début.',
        );
      }

      const occurrences = this.recurrenceExpander.expand(
        dto.recurrenceRule!,
        start,
        end,
        recurrenceEndAt,
        dto.timeZone ?? undefined,
      );

      if (occurrences.length === 0) {
        throw new ReservationBadRequestError(
          'Aucune occurrence générée pour cette règle de récurrence.',
        );
      }

      for (const occ of occurrences) {
        if (!isWithinReservationWindow(occ.startDatetime, occ.endDatetime)) {
          throw new ReservationBadRequestError(RESERVATION_WINDOW_MESSAGE);
        }
        if (!isStartInFuture(occ.startDatetime)) {
          throw new ReservationBadRequestError(RESERVATION_FUTURE_MESSAGE);
        }
        const hasOverlap = await this.reservationRepository.hasOverlap(
          dto.spaceId,
          occ.startDatetime,
          occ.endDatetime,
          undefined,
          dto.seatId ?? null,
        );
        if (hasOverlap) {
          const dateLisible = occ.startDatetime.toLocaleString('fr-FR', {
            dateStyle: 'medium',
            timeStyle: 'short',
          });
          throw new ReservationConflictError(
            `Impossible de créer la série : le ${dateLisible} l'espace est déjà réservé. Choisissez d'autres dates ou un autre espace.`,
          );
        }
      }

      const inputs: CreateReservationInput[] = occurrences.map((occ) => ({
        spaceId: dto.spaceId,
        seatId: dto.seatId ?? null,
        userId: effectiveUserId,
        startDatetime: occ.startDatetime,
        endDatetime: occ.endDatetime,
        title: dto.title ?? null,
        isPrivate: dto.isPrivate ?? false,
        recurrenceRule: dto.recurrenceRule ?? null,
        recurrenceEndAt: recurrenceEndAt,
        recurrenceGroupId,
      }));

      const created = await this.reservationRepository.createMany(inputs);
      return { created: created.length, recurrenceGroupId, first: created[0] };
    }

    const hasOverlap = await this.reservationRepository.hasOverlap(
      dto.spaceId,
      start,
      end,
      undefined,
      dto.seatId ?? null,
    );

    if (hasOverlap) {
      throw new ReservationConflictError('Ce créneau chevauche une réservation existante.');
    }

    return this.reservationRepository.create({
      spaceId: dto.spaceId,
      seatId: dto.seatId ?? null,
      userId: effectiveUserId,
      startDatetime: start,
      endDatetime: end,
      title: dto.title ?? null,
      isPrivate: dto.isPrivate ?? false,
      recurrenceRule: null,
      recurrenceEndAt: null,
      recurrenceGroupId: null,
    });
  }
}
