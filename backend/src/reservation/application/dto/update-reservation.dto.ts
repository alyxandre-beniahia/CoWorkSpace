export class UpdateReservationDto {
  startDatetime?: string;
  endDatetime?: string;
  title?: string | null;
  isPrivate?: boolean;
  recurrenceRule?: string | null;
  recurrenceEndAt?: string | null;
}
