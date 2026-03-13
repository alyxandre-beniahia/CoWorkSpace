import { PrismaService } from '../../../src/prisma/prisma.service';
import { createTestApp, getAuthToken } from '../setup/test-app';
import { cleanupAuthData } from '../setup/test-db';
import { createTestUser } from '../../integration/setup/fixtures/auth.fixtures';

describe('Parcours mot de passe (fonctionnel)', () => {
  let app: Awaited<ReturnType<typeof createTestApp>>['app'];
  let req: Awaited<ReturnType<typeof createTestApp>>['request'];
  let prisma: PrismaService | undefined;

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    req = testApp.request;
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app?.close();
  });

  afterEach(async () => {
    if (prisma) await cleanupAuthData(prisma);
  });

  it('change-password : login → change-password → login avec nouveau mot de passe', async () => {
    const { user, plainPassword } = await createTestUser(prisma!, {
      email: `it-changepwd-${Date.now()}@test.com`,
    });
    const token = await getAuthToken(req, user.email, plainPassword);

    await req
      .post('/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPassword: plainPassword,
        newPassword: 'newpassword456',
        confirmPassword: 'newpassword456',
      })
      .expect(201);

    const loginRes = await req
      .post('/auth/login')
      .send({ email: user.email, password: 'newpassword456' })
      .expect(201);
    expect(loginRes.body).toHaveProperty('access_token');
  });

  it('forgot-password + reset-password : demande → récupération token → reset → login', async () => {
    const { user, plainPassword } = await createTestUser(prisma!, {
      email: `it-forgot-${Date.now()}@test.com`,
    });

    await req
      .post('/auth/forgot-password')
      .send({ email: user.email })
      .expect(201);

    const userToken = await prisma!.userToken.findFirst({
      where: {
        type: 'PASSWORD_RESET',
        user: { email: user.email },
        deletedAt: null,
      },
      select: { token: true },
    });
    if (!userToken) throw new Error('Token de réinitialisation introuvable');

    await req
      .post('/auth/reset-password')
      .send({ token: userToken.token, password: 'newpassword789' })
      .expect(201);

    const loginRes = await req
      .post('/auth/login')
      .send({ email: user.email, password: 'newpassword789' })
      .expect(201);
    expect(loginRes.body).toHaveProperty('access_token');
  });

  it('400 : change-password si newPassword !== confirmPassword', async () => {
    const { user, plainPassword } = await createTestUser(prisma!, {
      email: `it-changepwd-400-${Date.now()}@test.com`,
    });
    const token = await getAuthToken(req, user.email, plainPassword);

    await req
      .post('/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPassword: plainPassword,
        newPassword: 'newpassword456',
        confirmPassword: 'different',
      })
      .expect(400);
  });

  it('401 : change-password avec mot de passe actuel incorrect', async () => {
    const { user, plainPassword } = await createTestUser(prisma!, {
      email: `it-changepwd-401-${Date.now()}@test.com`,
    });
    const token = await getAuthToken(req, user.email, plainPassword);

    await req
      .post('/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPassword: 'wrong',
        newPassword: 'newpassword456',
        confirmPassword: 'newpassword456',
      })
      .expect(401);
  });

  it('401 : change-password sans token', async () => {
    await req
      .post('/auth/change-password')
      .send({
        currentPassword: 'password123',
        newPassword: 'newpassword456',
        confirmPassword: 'newpassword456',
      })
      .expect(401);
  });

  it('400 : reset-password sans token', async () => {
    await req
      .post('/auth/reset-password')
      .send({ password: 'newpassword789' })
      .expect(400);
  });

  it('404 : reset-password avec token invalide', async () => {
    await req
      .post('/auth/reset-password')
      .send({ token: 'invalid-token-xyz', password: 'newpassword789' })
      .expect(404);
  });
});
