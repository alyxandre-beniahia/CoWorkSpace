import { SendRegistrationApprovedUseCase } from './send-registration-approved.use-case';
import type { INotificationEmailSender } from '../ports/notification-email-sender.port';
import type { INotificationLogRepository } from '../../domain/repositories/notification-log.repository.interface';

describe('SendRegistrationApprovedUseCase', () => {
  let useCase: SendRegistrationApprovedUseCase;
  let mockEmailSender: jest.Mocked<INotificationEmailSender>;
  let mockLogRepository: jest.Mocked<INotificationLogRepository>;

  beforeEach(() => {
    mockEmailSender = {
      sendRegistrationApproved: jest.fn().mockResolvedValue(undefined),
      sendRegistrationRejected: jest.fn(),
      sendReservationConfirmation: jest.fn(),
      sendReservationReminder24h: jest.fn(),
      sendReservationCancelled: jest.fn(),
      sendReservationModified: jest.fn(),
    };
    mockLogRepository = {
      create: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new SendRegistrationApprovedUseCase(
      mockEmailSender,
      mockLogRepository,
    );
  });

  it('envoie l’email puis log avec REGISTRATION_APPROVED', async () => {
    await useCase.run('user@test.com', 'user-id-123');

    expect(mockEmailSender.sendRegistrationApproved).toHaveBeenCalledTimes(1);
    expect(mockEmailSender.sendRegistrationApproved).toHaveBeenCalledWith(
      'user@test.com',
    );
    expect(mockLogRepository.create).toHaveBeenCalledTimes(1);
    expect(mockLogRepository.create).toHaveBeenCalledWith({
      type: 'REGISTRATION_APPROVED',
      userId: 'user-id-123',
      reservationId: null,
    });
  });
});
