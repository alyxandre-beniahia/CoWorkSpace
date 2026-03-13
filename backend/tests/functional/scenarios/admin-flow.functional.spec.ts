import { PrismaService } from '../../../src/prisma/prisma.service';
import { createTestApp, getAuthToken } from '../setup/test-app';
import { cleanupAuthData, cleanupAdminData } from '../setup/test-db';
import {
  createPendingMember,
  createTestSpace,
  createTestEquipement,
} from '../../integration/setup/fixtures/admin.fixtures';
import { createTestUser } from '../../integration/setup/fixtures/auth.fixtures';

describe('Parcours admin (fonctionnel)', () => {
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
    if (prisma) {
      await cleanupAuthData(prisma);
      await cleanupAdminData(prisma);
    }
  });

  it('admin : membres (list, valider) → espaces (create, update, equipement, delete)', async () => {
    const adminToken = await getAuthToken(req, 'admin@test.com', 'password123');

    const allRes = await req
      .get('/admin/membres?filter=all')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(Array.isArray(allRes.body)).toBe(true);

    const { user: pendingUser } = await createPendingMember(prisma!);
    const pendingRes = await req
      .get('/admin/membres?filter=pending')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(pendingRes.body.some((m: { id: string }) => m.id === pendingUser.id)).toBe(true);

    await req
      .patch(`/admin/membres/${pendingUser.id}/valider`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const membersRes = await req
      .get('/admin/membres?filter=members')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(membersRes.body.some((m: { id: string }) => m.id === pendingUser.id)).toBe(true);

    const spacesRes = await req
      .get('/admin/espaces')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(Array.isArray(spacesRes.body)).toBe(true);

    const code = `IT-FUNC-${Date.now()}`;
    const createSpaceRes = await req
      .post('/admin/espaces')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Salle fonctionnelle',
        type: 'MEETING_ROOM',
        capacity: 8,
        code,
        description: 'Description test',
        positionX: 100,
        positionY: 200,
      })
      .expect(201);
    const spaceId = createSpaceRes.body.id;
    expect(createSpaceRes.body.description).toBe('Description test');
    expect(createSpaceRes.body.positionX).toBe(100);
    expect(createSpaceRes.body.positionY).toBe(200);

    await req
      .patch(`/admin/espaces/${spaceId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Salle modifiée',
        capacity: 10,
        status: 'MAINTENANCE',
        description: 'Description mise à jour',
        positionX: 150,
        positionY: 250,
        type: 'OPEN_SPACE',
        code: `${code}-v2`,
      })
      .expect(200);

    const spaceAfter = await req
      .get('/admin/espaces')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    const updatedSpace = spaceAfter.body.find((s: { id: string }) => s.id === spaceId);
    expect(updatedSpace?.status).toBe('MAINTENANCE');

    const { equipement } = await createTestEquipement(prisma!);
    await req
      .post(`/admin/espaces/${spaceId}/equipements`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ equipementId: equipement.id })
      .expect(201);

    await req
      .delete(`/admin/espaces/${spaceId}/equipements/${equipement.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    await req
      .delete(`/admin/espaces/${spaceId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
  });

  it('admin : refuser un membre en attente', async () => {
    const adminToken = await getAuthToken(req, 'admin@test.com', 'password123');
    const { user } = await createPendingMember(prisma!);

    const res = await req
      .patch(`/admin/membres/${user.id}/refuser`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(res.body.message).toContain('refusée');
  });

  it('401 : GET /admin/membres sans token', async () => {
    await req.get('/admin/membres').expect(401);
  });

  it('PATCH /admin/espaces/:id avec id inexistant retourne erreur (500 - Prisma record not found)', async () => {
    const adminToken = await getAuthToken(req, 'admin@test.com', 'password123');
    const fakeId = 'clnonexistentid12345678901234';
    await req
      .patch(`/admin/espaces/${fakeId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Test' })
      .expect(500);
  });

  it('404 : PATCH /admin/membres/:id/valider avec id inexistant', async () => {
    const adminToken = await getAuthToken(req, 'admin@test.com', 'password123');
    const fakeId = 'clnonexistentid12345678901234';
    await req
      .patch(`/admin/membres/${fakeId}/valider`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(404);
  });

  it('403 : membre ne peut pas accéder à GET /admin/espaces', async () => {
    const memberToken = await getAuthToken(req, 'member@test.com', 'password123');
    await req
      .get('/admin/espaces')
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(403);
  });

  it('admin : actif (désactiver puis réactiver un membre)', async () => {
    const adminToken = await getAuthToken(req, 'admin@test.com', 'password123');
    const { user } = await createTestUser(prisma!, {
      email: `it-actif-${Date.now()}@test.com`,
      roleSlug: 'member',
    });

    await req
      .patch(`/admin/membres/${user.id}/actif?actif=false`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    await req
      .post('/auth/login')
      .send({ email: user.email, password: 'password123' })
      .expect(401);

    await req
      .patch(`/admin/membres/${user.id}/actif?actif=true`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const loginRes = await req
      .post('/auth/login')
      .send({ email: user.email, password: 'password123' })
      .expect(201);
    expect(loginRes.body).toHaveProperty('access_token');
  });
});
