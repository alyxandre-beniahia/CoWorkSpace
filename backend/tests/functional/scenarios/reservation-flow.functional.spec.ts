import { PrismaService } from '../../../src/database/prisma.service';
import { createTestApp, getAuthToken } from '../setup/test-app';
import { cleanupAuthData, cleanupReservationData } from '../setup/test-db';
import { createTestUser } from '../../integration/setup/fixtures/auth.fixtures';

function toIso(d: Date): string {
  return d.toISOString();
}

describe('Parcours réservation (fonctionnel)', () => {
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
      await cleanupReservationData(prisma);
      await cleanupAuthData(prisma);
    }
  });

  it('login membre → GET /spaces → POST /reservations → GET → GET/:id → PATCH → annuler → absence dans liste', async () => {
    const memberToken = await getAuthToken(req, 'member@test.com', 'password123');

    const spacesRes = await req.get('/spaces').expect(200);
    expect(spacesRes.body.length).toBeGreaterThan(0);
    const spaceId = spacesRes.body[0].id;

    const start = new Date(Date.now() + 48 * 60 * 60 * 1000);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const title = `it-${Date.now()}`;

    const createRes = await req
      .post('/reservations')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        spaceId,
        startDatetime: toIso(start),
        endDatetime: toIso(end),
        title,
      })
      .expect(201);
    const reservationId = createRes.body.id;

    const listRes = await req
      .get('/reservations')
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(200);
    expect(listRes.body.some((r: { id: string }) => r.id === reservationId)).toBe(true);

    const detailRes = await req
      .get(`/reservations/${reservationId}`)
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(200);
    expect(detailRes.body.id).toBe(reservationId);
    expect(detailRes.body.title).toBe(title);

    const newTitle = `${title}-modifié`;
    await req
      .patch(`/reservations/${reservationId}`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ title: newTitle })
      .expect(200);

    await req
      .patch(`/reservations/${reservationId}/annuler`)
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(200);

    const listAfter = await req
      .get('/reservations')
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(200);
    const found = listAfter.body.find((r: { id: string }) => r.id === reservationId);
    expect(found).toBeFalsy();
  });

  it('GET /reservations avec filtres calendrier (spaceId, from, to)', async () => {
    const memberToken = await getAuthToken(req, 'member@test.com', 'password123');

    const spacesRes = await req.get('/spaces').expect(200);
    const spaceId = spacesRes.body[0].id;

    const start = new Date(Date.now() + 72 * 60 * 60 * 1000);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const title = `it-cal-${Date.now()}`;

    const createRes = await req
      .post('/reservations')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        spaceId,
        startDatetime: toIso(start),
        endDatetime: toIso(end),
        title,
      })
      .expect(201);
    const reservationId = createRes.body.id;

    const fromStr = new Date(start.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const toStr = new Date(end.getTime() + 24 * 60 * 60 * 1000).toISOString();

    const calendarRes = await req
      .get(`/reservations?spaceId=${spaceId}&from=${fromStr}&to=${toStr}`)
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(200);
    expect(Array.isArray(calendarRes.body)).toBe(true);
    expect(calendarRes.body.some((r: { id: string }) => r.id === reservationId)).toBe(true);
  });

  it('réservation récurrente → annuler avec scope=all', async () => {
    const memberToken = await getAuthToken(req, 'member@test.com', 'password123');

    const spacesRes = await req.get('/spaces').expect(200);
    const spaceId = spacesRes.body[0].id;

    const start = new Date(Date.now() + 400 * 60 * 60 * 1000);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const recurrenceEndAt = new Date(start.getTime() + 72 * 60 * 60 * 1000);
    const title = `it-recur-${Date.now()}`;

    const createRes = await req
      .post('/reservations')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        spaceId,
        startDatetime: toIso(start),
        endDatetime: toIso(end),
        recurrenceRule: 'FREQ=DAILY',
        recurrenceEndAt: toIso(recurrenceEndAt),
        title,
      })
      .expect(201);
    expect(createRes.body.created).toBeGreaterThanOrEqual(1);
    expect(createRes.body).toHaveProperty('recurrenceGroupId');
    const firstId = createRes.body.first.id;

    await req
      .patch(`/reservations/${firstId}/annuler?scope=all`)
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(200);

    const listAfter = await req
      .get('/reservations')
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(200);
    const found = listAfter.body.find((r: { id: string }) => r.id === firstId);
    expect(found).toBeFalsy();
  });

  it('réservation privée (isPrivate) : propriétaire voit le titre', async () => {
    const memberToken = await getAuthToken(req, 'member@test.com', 'password123');

    const spacesRes = await req.get('/spaces').expect(200);
    const spaceId = spacesRes.body[0].id;

    const start = new Date(Date.now() + 500 * 60 * 60 * 1000);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const title = `it-private-${Date.now()}`;

    const createRes = await req
      .post('/reservations')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        spaceId,
        startDatetime: toIso(start),
        endDatetime: toIso(end),
        title,
        isPrivate: true,
      })
      .expect(201);
    const reservationId = createRes.body.id;

    const listRes = await req
      .get('/reservations')
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(200);
    const found = listRes.body.find((r: { id: string }) => r.id === reservationId);
    expect(found).toBeTruthy();
    expect(found.title).toBe(title);
    expect(found.isPrivate).toBe(true);
  });

  it('admin : GET /reservations?userId=xxx voit les réservations du membre', async () => {
    const adminToken = await getAuthToken(req, 'admin@test.com', 'password123');
    const memberToken = await getAuthToken(req, 'member@test.com', 'password123');

    const member = await prisma!.user.findUnique({
      where: { email: 'member@test.com' },
      select: { id: true },
    });
    if (!member) throw new Error('member@test.com introuvable');

    const spacesRes = await req.get('/spaces').expect(200);
    const spaceId = spacesRes.body[0].id;
    const start = new Date(Date.now() + 550 * 60 * 60 * 1000);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const title = `it-admin-filter-${Date.now()}`;

    await req
      .post('/reservations')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        spaceId,
        startDatetime: toIso(start),
        endDatetime: toIso(end),
        title,
      })
      .expect(201);

    const adminListRes = await req
      .get(`/reservations?userId=${member.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(adminListRes.body.some((r: { title: string }) => r.title === title)).toBe(true);
  });

  it('403 : membre ne peut pas PATCH ni annuler la réservation d\'un autre', async () => {
    const adminToken = await getAuthToken(req, 'admin@test.com', 'password123');
    const memberToken = await getAuthToken(req, 'member@test.com', 'password123');

    const spacesRes = await req.get('/spaces').expect(200);
    const spaceId = spacesRes.body[0].id;
    const start = new Date(Date.now() + 560 * 60 * 60 * 1000);
    const end = new Date(start.getTime() + 60 * 60 * 1000);

    const adminCreateRes = await req
      .post('/reservations')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        spaceId,
        startDatetime: toIso(start),
        endDatetime: toIso(end),
        title: `it-403-${Date.now()}`,
      })
      .expect(201);
    const reservationId = adminCreateRes.body.id;

    await req
      .patch(`/reservations/${reservationId}`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ title: 'Tentative' })
      .expect(403);

    await req
      .patch(`/reservations/${reservationId}/annuler`)
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(403);
  });

  it('réservation privée : autre utilisateur voit titre masqué (null) dans liste calendrier', async () => {
    const memberToken = await getAuthToken(req, 'member@test.com', 'password123');
    const { user: otherUser, plainPassword } = await createTestUser(prisma!, {
      email: `it-other-${Date.now()}@test.com`,
      roleSlug: 'member',
    });
    const otherToken = await getAuthToken(req, otherUser.email, plainPassword);

    const spacesRes = await req.get('/spaces').expect(200);
    const spaceId = spacesRes.body[0].id;
    const start = new Date(Date.now() + 570 * 60 * 60 * 1000);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const title = `it-masked-${Date.now()}`;

    await req
      .post('/reservations')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        spaceId,
        startDatetime: toIso(start),
        endDatetime: toIso(end),
        title,
        isPrivate: true,
      })
      .expect(201);

    const otherListRes = await req
      .get(`/reservations?spaceId=${spaceId}&from=${toIso(new Date(start.getTime() - 3600000))}&to=${toIso(new Date(end.getTime() + 3600000))}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(200);
    const privateResa = otherListRes.body.find((r: { title: string | null }) => r.title === null || r.title === 'Occupé');
    expect(privateResa).toBeTruthy();
    expect(privateResa.isPrivate).toBe(true);
  });

  it('PATCH /reservations/:id : startDatetime, endDatetime, isPrivate', async () => {
    const memberToken = await getAuthToken(req, 'member@test.com', 'password123');

    const spacesRes = await req.get('/spaces').expect(200);
    const spaceId = spacesRes.body[0].id;
    const start = new Date(Date.now() + 580 * 60 * 60 * 1000);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const title = `it-patch-${Date.now()}`;

    const createRes = await req
      .post('/reservations')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        spaceId,
        startDatetime: toIso(start),
        endDatetime: toIso(end),
        title,
      })
      .expect(201);
    const reservationId = createRes.body.id;

    const newStart = new Date(start.getTime() + 2 * 60 * 60 * 1000);
    const newEnd = new Date(newStart.getTime() + 90 * 60 * 1000);

    const patchRes = await req
      .patch(`/reservations/${reservationId}`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        startDatetime: toIso(newStart),
        endDatetime: toIso(newEnd),
        isPrivate: true,
      })
      .expect(200);
    expect(patchRes.body.startDatetime).toBeDefined();
    expect(patchRes.body.endDatetime).toBeDefined();
    expect(patchRes.body.isPrivate).toBe(true);
  });

  it('PATCH /reservations/:id : recurrenceRule, recurrenceEndAt', async () => {
    const memberToken = await getAuthToken(req, 'member@test.com', 'password123');

    const spacesRes = await req.get('/spaces').expect(200);
    const spaceId = spacesRes.body[0].id;
    const start = new Date(Date.now() + 590 * 60 * 60 * 1000);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const title = `it-recur-patch-${Date.now()}`;

    const createRes = await req
      .post('/reservations')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        spaceId,
        startDatetime: toIso(start),
        endDatetime: toIso(end),
        title,
      })
      .expect(201);
    const reservationId = createRes.body.id;

    const recurrenceEndAt = new Date(start.getTime() + 48 * 60 * 60 * 1000);
    const patchRes = await req
      .patch(`/reservations/${reservationId}`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        recurrenceRule: 'FREQ=WEEKLY',
        recurrenceEndAt: toIso(recurrenceEndAt),
      })
      .expect(200);
    expect(patchRes.body.id).toBe(reservationId);
  });

  it('GET /reservations/:id par non-propriétaire : réservation privée retourne title null, userName vide', async () => {
    const memberToken = await getAuthToken(req, 'member@test.com', 'password123');
    const { user: otherUser, plainPassword } = await createTestUser(prisma!, {
      email: `it-viewer-${Date.now()}@test.com`,
      roleSlug: 'member',
    });
    const otherToken = await getAuthToken(req, otherUser.email, plainPassword);

    const spacesRes = await req.get('/spaces').expect(200);
    const spaceId = spacesRes.body[0].id;
    const start = new Date(Date.now() + 595 * 60 * 60 * 1000);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const title = `it-private-detail-${Date.now()}`;

    const createRes = await req
      .post('/reservations')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        spaceId,
        startDatetime: toIso(start),
        endDatetime: toIso(end),
        title,
        isPrivate: true,
      })
      .expect(201);
    const reservationId = createRes.body.id;

    const detailRes = await req
      .get(`/reservations/${reservationId}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(200);
    expect(detailRes.body.id).toBe(reservationId);
    expect(detailRes.body.title).toBeNull();
    expect(detailRes.body.isPrivate).toBe(true);
    expect(detailRes.body.userName).toBe('');
    expect(detailRes.body.userEmail).toBe('');
  });

  it('400 : POST réservation récurrente avec recurrenceEndAt <= startDatetime', async () => {
    const memberToken = await getAuthToken(req, 'member@test.com', 'password123');
    const spacesRes = await req.get('/spaces').expect(200);
    const spaceId = spacesRes.body[0].id;
    const start = new Date(Date.now() + 605 * 60 * 60 * 1000);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const recurrenceEndAt = new Date(start.getTime() - 60 * 60 * 1000);

    const res = await req
      .post('/reservations')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        spaceId,
        startDatetime: toIso(start),
        endDatetime: toIso(end),
        recurrenceRule: 'FREQ=DAILY',
        recurrenceEndAt: toIso(recurrenceEndAt),
        title: `it-400-recur-${Date.now()}`,
      })
      .expect(400);
    expect(res.body.message).toContain('récurrence');
  });

  it('400 : POST /reservations avec endDatetime <= startDatetime', async () => {
    const memberToken = await getAuthToken(req, 'member@test.com', 'password123');
    const spacesRes = await req.get('/spaces').expect(200);
    const spaceId = spacesRes.body[0].id;
    const start = new Date(Date.now() + 600 * 60 * 60 * 1000);
    const end = new Date(start.getTime() - 60 * 60 * 1000);

    const res = await req
      .post('/reservations')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        spaceId,
        startDatetime: toIso(start),
        endDatetime: toIso(end),
        title: `it-400-${Date.now()}`,
      })
      .expect(400);
    expect(res.body.message).toContain('date de fin');
  });

  it('401 : POST /reservations sans token', async () => {
    const spacesRes = await req.get('/spaces').expect(200);
    const spaceId = spacesRes.body[0].id;
    const start = new Date(Date.now() + 610 * 60 * 60 * 1000);
    const end = new Date(start.getTime() + 60 * 60 * 1000);

    await req
      .post('/reservations')
      .send({
        spaceId,
        startDatetime: toIso(start),
        endDatetime: toIso(end),
        title: `it-401-${Date.now()}`,
      })
      .expect(401);
  });

  it('409 : PATCH /reservations/:id avec endDatetime <= startDatetime', async () => {
    const memberToken = await getAuthToken(req, 'member@test.com', 'password123');
    const spacesRes = await req.get('/spaces').expect(200);
    const spaceId = spacesRes.body[0].id;
    const start = new Date(Date.now() + 615 * 60 * 60 * 1000);
    const end = new Date(start.getTime() + 60 * 60 * 1000);

    const createRes = await req
      .post('/reservations')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        spaceId,
        startDatetime: toIso(start),
        endDatetime: toIso(end),
        title: `it-patch-409-${Date.now()}`,
      })
      .expect(201);
    const reservationId = createRes.body.id;

    const badEnd = new Date(start.getTime() - 60 * 60 * 1000);
    const res = await req
      .patch(`/reservations/${reservationId}`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        startDatetime: toIso(start),
        endDatetime: toIso(badEnd),
      })
      .expect(409);
    expect(res.body.message).toContain('date de fin');
  });

  it('404 : GET /reservations/:id avec id inexistant', async () => {
    const memberToken = await getAuthToken(req, 'member@test.com', 'password123');
    const fakeId = 'clnonexistentid12345678901234';

    await req
      .get(`/reservations/${fakeId}`)
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(404);
  });

  it('404 : PATCH /reservations/:id avec id inexistant', async () => {
    const memberToken = await getAuthToken(req, 'member@test.com', 'password123');
    const fakeId = 'clnonexistentid12345678901234';

    await req
      .patch(`/reservations/${fakeId}`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ title: 'Test' })
      .expect(404);
  });

  it('401 : GET /reservations sans token', async () => {
    await req.get('/reservations').expect(401);
  });

  it('404 : PATCH /reservations/:id/annuler avec id inexistant', async () => {
    const memberToken = await getAuthToken(req, 'member@test.com', 'password123');
    const fakeId = 'clnonexistentid12345678901234';
    await req
      .patch(`/reservations/${fakeId}/annuler`)
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(404);
  });

  it('409 : POST /reservations chevauchement', async () => {
    const memberToken = await getAuthToken(req, 'member@test.com', 'password123');
    const spacesRes = await req.get('/spaces').expect(200);
    const spaceId = spacesRes.body[0].id;
    const start = new Date(Date.now() + 620 * 60 * 60 * 1000);
    const end = new Date(start.getTime() + 60 * 60 * 1000);

    await req
      .post('/reservations')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        spaceId,
        startDatetime: toIso(start),
        endDatetime: toIso(end),
        title: `it-409-${Date.now()}`,
      })
      .expect(201);

    const res = await req
      .post('/reservations')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        spaceId,
        startDatetime: toIso(start),
        endDatetime: toIso(end),
        title: `it-409-dup-${Date.now()}`,
      })
      .expect(409);
    expect(res.body.message).toContain('chevauche');
  });
});
