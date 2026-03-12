import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from './email.service';

describe('EmailService', () => {
  let service: EmailService;
  const originalEnv = process.env;

  beforeEach(async () => {
    jest.resetModules();
    process.env = {
      ...originalEnv,
      RESEND_API_KEY: '',
      RESEND_FROM: 'Test <onboarding@resend.dev>',
      APP_URL: 'http://localhost:5173',
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [EmailService],
    }).compile();

    service = module.get(EmailService);
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('envoie un email de vérification (mode log si pas de clé)', async () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation();
    await service.sendVerificationEmail('user@test.com', 'abc-token-123');
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringMatching(/user@test\.com.*verification-email\?token=abc-token-123/),
    );
    logSpy.mockRestore();
  });

  it('envoie un email de reset MDP (mode log si pas de clé)', async () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation();
    await service.sendPasswordResetEmail('other@test.com', 'xyz-reset-456');
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringMatching(/other@test\.com.*reset-mot-de-passe\?token=xyz-reset-456/),
    );
    logSpy.mockRestore();
  });

  it('sendRegistrationApprovedEmail logue avec email et validée/inscription (mode log)', async () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation();
    await service.sendRegistrationApprovedEmail('membre@test.com');
    const call = logSpy.mock.calls[0]?.[0];
    expect(call).toMatch(/membre@test\.com/);
    expect(call).toMatch(/validée|inscription/i);
    logSpy.mockRestore();
  });

  it('sendRegistrationRejectedEmail logue avec email et refusée (mode log)', async () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation();
    await service.sendRegistrationRejectedEmail('refuse@test.com');
    const call = logSpy.mock.calls[0]?.[0];
    expect(call).toMatch(/refuse@test\.com/);
    expect(call).toMatch(/refusée/i);
    logSpy.mockRestore();
  });
});
