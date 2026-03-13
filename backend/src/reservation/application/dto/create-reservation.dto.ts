export class CreateReservationDto {
  spaceId!: string;
  startDatetime!: string;
  endDatetime!: string;
  title?: string | null;
  isPrivate?: boolean;
  recurrenceRule?: string | null;
  recurrenceEndAt?: string | null;
}
