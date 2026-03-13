import { BadRequestException, Injectable } from '@nestjs/common';
import type { ReservationCalendarItem } from '../domain/reservation.repository.interface';
import { ReservationRepository } from '../infrastructure/reservation.repository';

export type ListReservationsForCalendarInput = {
  spaceId?: string;
  start: Date;
  end: Date;
  currentUserId: string;
};

export type ListReservationsForCalendarResult = Array<
  ReservationCalendarItem & {
    // titre éventuellement masqué côté lecture
    effectiveTitle: string | null;
    isOwner: boolean;
  }
>;

@Injectable()
export class ListReservationsForCalendarUseCase {
  private static readonly MAX_RANGE_DAYS = 60;

  constructor(private readonly reservationRepository: ReservationRepository) {}

  async run(input: ListReservationsForCalendarInput): Promise<ListReservationsForCalendarResult> {
    const { start, end, currentUserId, spaceId } = input;

    if (!start || !end) {
      throw new BadRequestException('Paramètres start et end requis');
    }
    if (end <= start) {
      throw new BadRequestException('La date de fin doit être postérieure à la date de début');
    }

    const diffMs = end.getTime() - start.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    if (diffDays > ListReservationsForCalendarUseCase.MAX_RANGE_DAYS) {
      throw new BadRequestException('La période demandée est trop large');
    }

    const items = await this.reservationRepository.listForCalendar({ spaceId, start, end });

    return items.map((item) => {
      const isOwner = item.userId === currentUserId;
      const effectiveTitle =
        item.isPrivate && !isOwner
          ? 'Occupé'
          : item.title;

      return {
        ...item,
        isOwner,
        effectiveTitle,
      };
    });
  }
}

