import { PrismaService } from '../../../src/database/prisma.service';
import { createTestApp, getAuthToken } from '../setup/test-app';
import { cleanupAuthData } from '../setup/test-db';
import { createTestUser } from '../../integration/setup/fixtures/auth.fixtures';

describe('Parcours profil (fonctionnel)', () => {
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

  it('login → GET /me → PATCH /me → GET /me vérifie la mise à jour', async () => {
    const { user, plainPassword } = await createTestUser(prisma!, {
      email: `it-profil-${Date.now()}@test.com`,
    });

    const memberToken = await getAuthToken(req, user.email, plainPassword);

    const meBefore = await req
      .get('/auth/me')
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(200);
    expect(meBefore.body.email).toBe(user.email);

    await req
      .patch('/auth/me')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ firstname: 'ProfilModifié', lastname: 'TestModifié', phone: '0612345678' })
      .expect(200);

    const meAfter = await req
      .get('/auth/me')
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(200);
    expect(meAfter.body).toMatchObject({
      firstname: 'ProfilModifié',
      lastname: 'TestModifié',
      phone: '0612345678',
    });
  });

  it('401 : PATCH /auth/me sans token', async () => {
    await req
      .patch('/auth/me')
      .send({ firstname: 'Test' })
      .expect(401);
  });
});
