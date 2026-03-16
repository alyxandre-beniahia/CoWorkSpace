import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request = require('supertest');
import { AppModule } from '../../../src/app.module';
import { EmailService } from '../../../src/notification/infrastructure/email.service';

const mockEmailService = {
  sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
  sendRegistrationApprovedEmail: jest.fn().mockResolvedValue(undefined),
  sendRegistrationRejectedEmail: jest.fn().mockResolvedValue(undefined),
  sendReservationConfirmationEmail: jest.fn().mockResolvedValue(undefined),
  sendReservationReminder24hEmail: jest.fn().mockResolvedValue(undefined),
  sendReservationCancelledEmail: jest.fn().mockResolvedValue(undefined),
  sendReservationModifiedEmail: jest.fn().mockResolvedValue(undefined),
};

export async function createTestApp(): Promise<{
  app: INestApplication;
  request: import('supertest').SuperAgentTest;
}> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(EmailService)
    .useValue(mockEmailService)
    .compile();

  const app = moduleFixture.createNestApplication();
  await app.init();

  const httpRequest = request(app.getHttpServer());
  return {
    app,
    request: httpRequest as unknown as import('supertest').SuperAgentTest,
  };
}

/**
 * Effectue un login et retourne le token JWT.
 */
export async function getAuthToken(
  req: import('supertest').SuperAgentTest,
  email: string,
  password: string,
): Promise<string> {
  const res = await req
    .post('/auth/login')
    .send({ email, password })
    .expect(201);
  if (!res.body?.access_token) {
    throw new Error('Pas de access_token dans la réponse login');
  }
  return res.body.access_token;
}
