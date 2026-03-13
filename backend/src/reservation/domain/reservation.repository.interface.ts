export type ReservationCalendarItem = {
  id: string;
  spaceId: string;
  userId: string;
  startDatetime: Date;
  endDatetime: Date;
  isPrivate: boolean;
  title: string | null;
};

export interface IReservationRepository {
  listForCalendar(params: {
    spaceId?: string;
    start: Date;
    end: Date;
  }): Promise<ReservationCalendarItem[]>;
}

