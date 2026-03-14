export class CreateReservationDto {
  spaceId!: string;
  seatId?: string | null;
  startDatetime!: string;
  endDatetime!: string;
  title?: string | null;
  isPrivate?: boolean;
  recurrenceRule?: string | null;
  recurrenceEndAt?: string | null;
  /** Fuseau IANA (ex. Europe/Paris) pour ancrer la récurrence à la même heure locale (heure d'été). */
  timeZone?: string | null;
}
