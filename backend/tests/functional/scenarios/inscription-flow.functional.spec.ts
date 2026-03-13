import { PrismaService } from '../../../src/prisma/prisma.service';
import { createTestApp, getAuthToken } from '../setup/test-app';
import { cleanupAuthData } from '../setup/test-db';

describe('Parcours inscription (fonctionnel)', () => {
  let app: Awaited<ReturnType<typeof createTestApp>>['app'];
  let req: Awaited<ReturnType<typeof createTestApp>>['request'];
  let prisma: PrismaService | undefined;
  let registeredEmail: string;
  const password = 'password123';

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

  it('inscription complète : register → verify → admin valide → login → me → déconnexion → reconnexion', async () => {
    registeredEmail = `it-func-${Date.now()}@test.com`;

    const registerRes = await req
      .post('/auth/register')
      .send({
        firstname: 'Func',
        lastname: 'Test',
        email: registeredEmail,
        password,
      })
      .expect(201);

    expect(registerRes.body.message).toContain('Vérifiez vos emails');

    const userToken = await prisma!.userToken.findFirst({
      where: {
        type: 'EMAIL_VERIFICATION',
        user: { email: registeredEmail },
        deletedAt: null,
      },
      select: { token: true },
    });
    if (!userToken) throw new Error('Token de vérification introuvable');

    const verifyRes = await req
      .get(`/auth/verify-email?token=${userToken.token}`)
      .expect(200);
    expect(verifyRes.body.message).toContain('vérifié');

    const adminToken = await getAuthToken(req, 'admin@test.com', 'password123');
    const pendingMembers = await req
      .get('/admin/membres?filter=pending')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    const member = pendingMembers.body.find((m: { email: string }) => m.email === registeredEmail);
    if (!member) throw new Error('Membre en attente introuvable');

    await req
      .patch(`/admin/membres/${member.id}/valider`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const loginRes = await req
      .post('/auth/login')
      .send({ email: registeredEmail, password })
      .expect(201);
    expect(loginRes.body).toHaveProperty('access_token');
    const memberToken = loginRes.body.access_token;

    const meRes = await req
      .get('/auth/me')
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(200);
    expect(meRes.body.email).toBe(registeredEmail);

    await req.get('/auth/me').expect(401);

    const reconnectRes = await req
      .post('/auth/login')
      .send({ email: registeredEmail, password })
      .expect(201);
    expect(reconnectRes.body).toHaveProperty('access_token');
  });

  it('400 : register avec email déjà utilisé', async () => {
    const email = `it-dup-${Date.now()}@test.com`;
    await req
      .post('/auth/register')
      .send({ firstname: 'A', lastname: 'B', email, password: 'password123' })
      .expect(201);
    const res = await req
      .post('/auth/register')
      .send({ firstname: 'C', lastname: 'D', email, password: 'password123' })
      .expect(400);
    expect(res.body.message).toBeDefined();
  });

  it('400 : verify-email sans token', async () => {
    await req.get('/auth/verify-email').expect(400);
  });

  it('404 : verify-email avec token invalide', async () => {
    const res = await req
      .get('/auth/verify-email?token=invalid-token-xyz')
      .expect(404);
    expect(res.body.message).toBeDefined();
  });

  it('401 : login avec mot de passe incorrect', async () => {
    await req
      .post('/auth/login')
      .send({ email: 'admin@test.com', password: 'wrongpassword' })
      .expect(401);
  });
});
