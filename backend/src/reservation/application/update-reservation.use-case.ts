import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { ReservationRepository } from '../infrastructure/reservation.repository';
import type { UpdateReservationInput } from '../domain/reservation.entity';
import type { UpdateReservationDto } from './dto/update-reservation.dto';

@Injectable()
export class UpdateReservationUseCase {
  constructor(private readonly reservationRepository: ReservationRepository) {}

  async run(reservationId: string, userId: string, dto: UpdateReservationDto) {
    const input: UpdateReservationInput = {
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
      throw new NotFoundException('Réservation introuvable.');
    }
    if (existing.userId !== userId) {
      throw new ForbiddenException('Vous ne pouvez modifier que vos propres réservations.');
    }

    const start = input.startDatetime ?? existing.startDatetime;
    const end = input.endDatetime ?? existing.endDatetime;

    if (end <= start) {
      throw new ConflictException('La date de fin doit être après la date de début.');
    }

    const hasOverlap = await this.reservationRepository.hasOverlap(
      existing.spaceId,
      start,
      end,
      reservationId,
    );

    if (hasOverlap) {
      throw new ConflictException('Ce créneau chevauche une réservation existante.');
    }

    const updated = await this.reservationRepository.update(reservationId, input);

    return updated;
  }
}
