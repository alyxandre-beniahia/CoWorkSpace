export type CreateReservationDto = {
  spaceId: string;
  seatId?: string | null;
  startDatetime: string;
  endDatetime: string;
  title?: string | null;
  isPrivate?: boolean;
  recurrenceRule?: string | null;
  recurrenceEndAt?: string | null;
  timeZone?: string | null;
  userId?: string | null;
};
