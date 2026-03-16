import { SendScheduledRemindersUseCase } from './send-scheduled-reminders.use-case';
import type { IReservationsForReminder } from '../ports/reservations-for-reminder.port';
import type { ReservationNotificationPayload } from '../../domain/entities/reservation-notification.payload';
import { SendReservationReminder24hUseCase } from './send-reservation-reminder24h.use-case';

describe('SendScheduledRemindersUseCase', () => {
  let useCase: SendScheduledRemindersUseCase;
  let mockReservationsForReminder: jest.Mocked<IReservationsForReminder>;
  let mockSendReminderUseCase: jest.Mocked<SendReservationReminder24hUseCase>;

  const payload: ReservationNotificationPayload = {
    userId: 'user-1',
    userEmail: 'user@test.com',
    reservationId: 'res-1',
    spaceName: 'Salle A',
    startDatetime: new Date(),
    endDatetime: new Date(),
  };

  beforeEach(() => {
    mockReservationsForReminder = {
      findReservationsStartingBetween: jest.fn().mockResolvedValue([]),
    };
    mockSendReminderUseCase = {
      run: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<SendReservationReminder24hUseCase>;
    useCase = new SendScheduledRemindersUseCase(
      mockReservationsForReminder,
      mockSendReminderUseCase,
    );
  });

  it('appelle findReservationsStartingBetween(now, now+24h) puis envoie un rappel par résa', async () => {
    mockReservationsForReminder.findReservationsStartingBetween.mockResolvedValue(
      [payload],
    );

    const result = await useCase.run();

    expect(result.sent).toBe(1);
    expect(
      mockReservationsForReminder.findReservationsStartingBetween,
    ).toHaveBeenCalledTimes(1);
    const [start, end] = mockReservationsForReminder.findReservationsStartingBetween.mock.calls[0];
    expect(start).toBeInstanceOf(Date);
    expect(end).toBeInstanceOf(Date);
    expect(end.getTime() - start.getTime()).toBe(24 * 60 * 60 * 1000);
    expect(mockSendReminderUseCase.run).toHaveBeenCalledWith(payload);
  });

  it('retourne sent: 0 quand aucune réservation', async () => {
    const result = await useCase.run();
    expect(result.sent).toBe(0);
    expect(mockSendReminderUseCase.run).not.toHaveBeenCalled();
  });
});
