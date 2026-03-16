import { SendReservationConfirmationUseCase } from './send-reservation-confirmation.use-case';
import type { INotificationEmailSender } from '../ports/notification-email-sender.port';
import type { INotificationLogRepository } from '../../domain/repositories/notification-log.repository.interface';
import type { ReservationNotificationPayload } from '../../domain/entities/reservation-notification.payload';

describe('SendReservationConfirmationUseCase', () => {
  let useCase: SendReservationConfirmationUseCase;
  let mockEmailSender: jest.Mocked<INotificationEmailSender>;
  let mockLogRepository: jest.Mocked<INotificationLogRepository>;

  const payload: ReservationNotificationPayload = {
    userId: 'user-1',
    userEmail: 'user@test.com',
    reservationId: 'res-1',
    spaceName: 'Salle A',
    startDatetime: new Date('2026-04-01T10:00:00Z'),
    endDatetime: new Date('2026-04-01T11:00:00Z'),
    title: 'Réunion',
  };

  beforeEach(() => {
    mockEmailSender = {
      sendRegistrationApproved: jest.fn(),
      sendRegistrationRejected: jest.fn(),
      sendReservationConfirmation: jest.fn().mockResolvedValue(undefined),
      sendReservationReminder24h: jest.fn(),
      sendReservationCancelled: jest.fn(),
      sendReservationModified: jest.fn(),
    };
    mockLogRepository = {
      create: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new SendReservationConfirmationUseCase(
      mockEmailSender,
      mockLogRepository,
    );
  });

  it('envoie l’email de confirmation puis log', async () => {
    await useCase.run(payload);

    expect(mockEmailSender.sendReservationConfirmation).toHaveBeenCalledTimes(
      1,
    );
    expect(mockEmailSender.sendReservationConfirmation).toHaveBeenCalledWith(
      payload.userEmail,
      payload,
    );
    expect(mockLogRepository.create).toHaveBeenCalledWith({
      type: 'RESERVATION_CONFIRMATION',
      userId: payload.userId,
      reservationId: payload.reservationId,
    });
  });
});
