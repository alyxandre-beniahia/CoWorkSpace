export type UpdateReservationDto = {
  seatId?: string | null;
  startDatetime?: string;
  endDatetime?: string;
  title?: string | null;
  isPrivate?: boolean;
  recurrenceRule?: string | null;
  recurrenceEndAt?: string | null;
};
