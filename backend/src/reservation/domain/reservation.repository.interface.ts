import type { ReservationListFilters } from './reservation-list.filters';
import type {
  ReservationListItem,
  ReservationWithDetails,
  CreateReservationInput,
  UpdateReservationInput,
} from './reservation.entity';

export interface IReservationRepository {
  list(filters: ReservationListFilters): Promise<ReservationListItem[]>;
  findById(id: string, currentUserId?: string): Promise<ReservationWithDetails | null>;
  create(input: CreateReservationInput): Promise<ReservationWithDetails>;
  createMany(inputs: CreateReservationInput[]): Promise<ReservationWithDetails[]>;
  update(id: string, input: UpdateReservationInput): Promise<ReservationWithDetails | null>;
  softDelete(id: string): Promise<boolean>;
  softDeleteByRecurrenceGroupId(recurrenceGroupId: string): Promise<number>;
  hasOverlap(spaceId: string, start: Date, end: Date, excludeReservationId?: string): Promise<boolean>;
}
