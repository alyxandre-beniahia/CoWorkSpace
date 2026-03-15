import type { ReservationListFilters } from '../filters/reservation-list.filters';
import type {
  ReservationListItem,
  ReservationWithDetails,
  ReservationCalendarItem,
  CreateReservationInput,
  UpdateReservationInput,
} from '../entities/reservation.entity';

/** Token d'injection pour l'implémentation du repository (utilisé par le module Nest). */
export const RESERVATION_REPOSITORY = 'IReservationRepository';

export interface IReservationRepository {
  list(filters: ReservationListFilters): Promise<ReservationListItem[]>;
  findById(
    id: string,
    currentUserId?: string,
    options?: { unmaskPrivate?: boolean },
  ): Promise<ReservationWithDetails | null>;
  create(input: CreateReservationInput): Promise<ReservationWithDetails>;
  createMany(inputs: CreateReservationInput[]): Promise<ReservationWithDetails[]>;
  update(id: string, input: UpdateReservationInput): Promise<ReservationWithDetails | null>;
  softDelete(id: string): Promise<boolean>;
  softDeleteByRecurrenceGroupId(recurrenceGroupId: string): Promise<number>;
  hasOverlap(
    spaceId: string,
    start: Date,
    end: Date,
    excludeReservationId?: string,
    seatId?: string | null,
  ): Promise<boolean>;
  /** Vérifie si l'utilisateur a déjà une réservation qui chevauche [start, end] (tous espaces). */
  hasUserOverlap(
    userId: string,
    start: Date,
    end: Date,
    excludeReservationId?: string,
  ): Promise<boolean>;
  listForCalendar(params: {
    spaceId?: string;
    start: Date;
    end: Date;
  }): Promise<ReservationCalendarItem[]>;
}
