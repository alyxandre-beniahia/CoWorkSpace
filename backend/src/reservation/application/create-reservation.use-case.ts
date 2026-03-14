import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ReservationRepository } from '../infrastructure/reservation.repository';
import type { CreateReservationInput } from '../domain/reservation.entity';
import type { CreateReservationDto } from './dto/create-reservation.dto';
import { expandRecurrence } from './recurrence.utils';

@Injectable()
export class CreateReservationUseCase {
  constructor(private readonly reservationRepository: ReservationRepository) {}

  async run(userId: string, dto: CreateReservationDto) {
    const start = new Date(dto.startDatetime);
    const end = new Date(dto.endDatetime);

    if (end <= start) {
      throw new BadRequestException('La date de fin doit être après la date de début.');
    }

    const isRecurring = dto.recurrenceRule && dto.recurrenceEndAt;
    const recurrenceGroupId = isRecurring ? randomUUID() : null;

    if (isRecurring) {
      const recurrenceEndAt = new Date(dto.recurrenceEndAt!);
      if (recurrenceEndAt <= start) {
        throw new BadRequestException(
          'La date de fin de récurrence doit être après la date de début.',
        );
      }

      const occurrences = expandRecurrence(
        dto.recurrenceRule!,
        start,
        end,
        recurrenceEndAt,
        dto.timeZone ?? undefined,
      );

      if (occurrences.length === 0) {
        throw new BadRequestException(
          'Aucune occurrence générée pour cette règle de récurrence.',
        );
      }

      for (const occ of occurrences) {
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
          throw new ConflictException(
            `Impossible de créer la série : le ${dateLisible} l'espace est déjà réservé. Choisissez d'autres dates ou un autre espace.`,
          );
        }
      }

      const inputs: CreateReservationInput[] = occurrences.map((occ) => ({
        spaceId: dto.spaceId,
        seatId: dto.seatId ?? null,
        userId,
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
      throw new ConflictException('Ce créneau chevauche une réservation existante.');
    }

    return this.reservationRepository.create({
      spaceId: dto.spaceId,
      seatId: dto.seatId ?? null,
      userId,
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

