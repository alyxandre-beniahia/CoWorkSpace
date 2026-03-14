import { PrismaService } from '../../../src/prisma/prisma.service';
import { createTestApp, getAuthToken } from '../setup/test-app';
import { cleanupReservationData } from '../setup/test-db';
import { createTestReservation } from '../setup/fixtures/reservation.fixtures';

const FAKE_ID = 'clnonexistentid12345678901234';

function toIso(d: Date): string {
  return d.toISOString();
}

describe('Reservation (intégration)', () => {
  let app: Awaited<ReturnType<typeof createTestApp>>['app'];
  let req: Awaited<ReturnType<typeof createTestApp>>['request'];
  let prisma: PrismaService | undefined;
  let memberToken: string;
  let adminToken: string;
  let memberId: string;
  let adminId: string;
  let spaceId: string;
  let spaceIdB: string;
  let spaceIdC: string;
  let openSpaceId: string;
  let openSpaceSeat1Id: string;
  let openSpaceSeat2Id: string;

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    req = testApp.request;
    prisma = app.get(PrismaService);
    memberToken = await getAuthToken(req, 'member@test.com', 'password123');
    adminToken = await getAuthToken(req, 'admin@test.com', 'password123');

    const member = await prisma!.user.findUnique({
      where: { email: 'member@test.com' },
      select: { id: true },
    });
    if (!member) throw new Error('member@test.com introuvable. Exécutez le seed.');
    memberId = member.id;

    const admin = await prisma!.user.findUnique({
      where: { email: 'admin@test.com' },
      select: { id: true },
    });
    if (!admin) throw new Error('admin@test.com introuvable. Exécutez le seed.');
    adminId = admin.id;

    const space = await prisma!.space.findUnique({
      where: { code: 'SR-A' },
      select: { id: true },
    });
    if (!space) throw new Error('Espace SR-A introuvable. Exécutez le seed.');
    spaceId = space.id;

    const spaceB = await prisma!.space.findUnique({
      where: { code: 'SR-B' },
      select: { id: true },
    });
    if (!spaceB) throw new Error('Espace SR-B introuvable. Exécutez le seed.');
    spaceIdB = spaceB.id;

    const spaceC = await prisma!.space.findUnique({
      where: { code: 'SR-C' },
      select: { id: true },
    });
    if (!spaceC) throw new Error('Espace SR-C introuvable. Exécutez le seed.');
    spaceIdC = spaceC.id;

    const openSpace = await prisma!.space.findUnique({
      where: { code: 'OPEN-SPACE' },
      select: { id: true },
    });
    if (!openSpace) throw new Error('Espace OPEN-SPACE introuvable. Exécutez le seed.');
    openSpaceId = openSpace.id;

    const seats = await prisma!.seat.findMany({
      where: { spaceId: openSpaceId },
      orderBy: { code: 'asc' },
      take: 2,
      select: { id: true },
    });
    if (seats.length < 2) throw new Error('Au moins 2 postes requis pour l\'openspace. Exécutez le seed.');
    openSpaceSeat1Id = seats[0].id;
    openSpaceSeat2Id = seats[1].id;
  });

  afterAll(async () => {
    await app?.close();
  });

  afterEach(async () => {
    if (prisma) await cleanupReservationData(prisma);
  });

  describe('POST /reservations', () => {
    it('crée une réservation', async () => {
      const start = new Date(Date.now() + 48 * 60 * 60 * 1000);
      const end = new Date(start.getTime() + 60 * 60 * 1000);

      const res = await req
        .post('/reservations')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          spaceId,
          startDatetime: toIso(start),
          endDatetime: toIso(end),
          title: `it-${Date.now()}`,
        })
        .expect(201);

      expect(res.body).toMatchObject({
        spaceId,
        title: expect.stringContaining('it-'),
      });
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('startDatetime');
      expect(res.body).toHaveProperty('endDatetime');
    });

    it('retourne 400 si fin <= début', async () => {
      const start = new Date(Date.now() + 48 * 60 * 60 * 1000);
      const end = new Date(start.getTime() - 60 * 60 * 1000);

      const res = await req
        .post('/reservations')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          spaceId,
          startDatetime: toIso(start),
          endDatetime: toIso(end),
          title: `it-${Date.now()}`,
        })
        .expect(400);

      expect(res.body.message).toContain('date de fin');
    });

    it('retourne 401 sans token', async () => {
      const start = new Date(Date.now() + 48 * 60 * 60 * 1000);
      const end = new Date(start.getTime() + 60 * 60 * 1000);

      await req
        .post('/reservations')
        .send({
          spaceId,
          startDatetime: toIso(start),
          endDatetime: toIso(end),
          title: `it-${Date.now()}`,
        })
        .expect(401);
    });

    it('retourne 409 si chevauchement', async () => {
      const start = new Date(Date.now() + 72 * 60 * 60 * 1000);
      const end = new Date(start.getTime() + 60 * 60 * 1000);

      await createTestReservation(prisma!, {
        userId: memberId,
        spaceId,
        startDatetime: start,
        endDatetime: end,
      });

      const res = await req
        .post('/reservations')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          spaceId,
          startDatetime: toIso(start),
          endDatetime: toIso(end),
          title: `it-${Date.now()}`,
        })
        .expect(409);

      expect(res.body.message).toContain('chevauche');
    });

    describe('réservation par poste (openspace)', () => {
      it('crée une réservation avec seatId sur un poste', async () => {
        const start = new Date(Date.now() + 400 * 60 * 60 * 1000);
        const end = new Date(start.getTime() + 60 * 60 * 1000);

        const res = await req
          .post('/reservations')
          .set('Authorization', `Bearer ${memberToken}`)
          .send({
            spaceId: openSpaceId,
            seatId: openSpaceSeat1Id,
            startDatetime: toIso(start),
            endDatetime: toIso(end),
            title: `it-seat-${Date.now()}`,
          })
          .expect(201);

        expect(res.body).toMatchObject({
          spaceId: openSpaceId,
          seatId: openSpaceSeat1Id,
          seatCode: 'OS-01',
          title: expect.stringContaining('it-seat-'),
        });
      });

      it('retourne 409 si même poste et même créneau', async () => {
        const start = new Date(Date.now() + 500 * 60 * 60 * 1000);
        const end = new Date(start.getTime() + 60 * 60 * 1000);

        await createTestReservation(prisma!, {
          userId: memberId,
          spaceId: openSpaceId,
          seatId: openSpaceSeat1Id,
          startDatetime: start,
          endDatetime: end,
          title: `it-seat-conflict-${Date.now()}`,
        });

        const res = await req
          .post('/reservations')
          .set('Authorization', `Bearer ${memberToken}`)
          .send({
            spaceId: openSpaceId,
            seatId: openSpaceSeat1Id,
            startDatetime: toIso(start),
            endDatetime: toIso(end),
            title: `it-seat-conflict-2-${Date.now()}`,
          })
          .expect(409);

        expect(res.body.message).toContain('chevauche');
      });

      it('crée une réservation sur un autre poste au même créneau', async () => {
        const start = new Date(Date.now() + 600 * 60 * 60 * 1000);
        const end = new Date(start.getTime() + 60 * 60 * 1000);

        await createTestReservation(prisma!, {
          userId: memberId,
          spaceId: openSpaceId,
          seatId: openSpaceSeat1Id,
          startDatetime: start,
          endDatetime: end,
          title: `it-seat-other-${Date.now()}`,
        });

        const res = await req
          .post('/reservations')
          .set('Authorization', `Bearer ${memberToken}`)
          .send({
            spaceId: openSpaceId,
            seatId: openSpaceSeat2Id,
            startDatetime: toIso(start),
            endDatetime: toIso(end),
            title: `it-seat-other-2-${Date.now()}`,
          })
          .expect(201);

        expect(res.body).toMatchObject({
          spaceId: openSpaceId,
          seatId: openSpaceSeat2Id,
          seatCode: 'OS-02',
        });
      });
    });

    it('crée une réservation récurrente', async () => {
      const start = new Date(Date.now() + 600 * 60 * 60 * 1000);
      const end = new Date(start.getTime() + 60 * 60 * 1000);
      const recurrenceEndAt = new Date(start.getTime() + 72 * 60 * 60 * 1000);

      const res = await req
        .post('/reservations')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          spaceId: spaceIdC,
          startDatetime: toIso(start),
          endDatetime: toIso(end),
          recurrenceRule: 'FREQ=DAILY',
          recurrenceEndAt: toIso(recurrenceEndAt),
          title: `it-recur-${Date.now()}`,
        })
        .expect(201);

      expect(res.body).toHaveProperty('created');
      expect(res.body).toHaveProperty('recurrenceGroupId');
      expect(res.body).toHaveProperty('first');
      expect(res.body.created).toBeGreaterThanOrEqual(1);
      expect(res.body.first).toMatchObject({
        spaceId: spaceIdC,
        title: expect.stringContaining('it-recur-'),
      });
    });

    it('retourne 400 si recurrenceEndAt <= startDatetime', async () => {
      const start = new Date(Date.now() + 650 * 60 * 60 * 1000);
      const end = new Date(start.getTime() + 60 * 60 * 1000);
      const recurrenceEndAt = new Date(start.getTime() - 60 * 60 * 1000);

      const res = await req
        .post('/reservations')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          spaceId: spaceIdC,
          startDatetime: toIso(start),
          endDatetime: toIso(end),
          recurrenceRule: 'FREQ=DAILY',
          recurrenceEndAt: toIso(recurrenceEndAt),
          title: `it-recur-${Date.now()}`,
        })
        .expect(400);

      expect(res.body.message).toContain('récurrence');
    });

    it('retourne 409 si une occurrence de la série récurrente chevauche une réservation existante', async () => {
      const start = new Date(Date.now() + 800 * 60 * 60 * 1000);
      const end = new Date(start.getTime() + 60 * 60 * 1000);
      const recurrenceEndAt = new Date(start.getTime() + 72 * 60 * 60 * 1000);

      await createTestReservation(prisma!, {
        userId: memberId,
        spaceId: spaceIdC,
        startDatetime: new Date(start.getTime() + 24 * 60 * 60 * 1000),
        endDatetime: new Date(start.getTime() + 25 * 60 * 60 * 1000),
      });

      const res = await req
        .post('/reservations')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          spaceId: spaceIdC,
          startDatetime: toIso(start),
          endDatetime: toIso(end),
          recurrenceRule: 'FREQ=DAILY',
          recurrenceEndAt: toIso(recurrenceEndAt),
          title: `it-recur-409-${Date.now()}`,
        })
        .expect(409);

      expect(res.body.message).toContain('Impossible de créer la série');
      expect(res.body.message).toContain('déjà réservé');
    });
  });

  describe('GET /reservations', () => {
    it('retourne la liste des réservations du membre', async () => {
      const { reservation } = await createTestReservation(prisma!, {
        userId: memberId,
        spaceId,
      });

      const res = await req
        .get('/reservations')
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      const found = res.body.find((r: { id: string }) => r.id === reservation.id);
      expect(found).toBeTruthy();
    });

    it('filtre par spaceId', async () => {
      const { reservation } = await createTestReservation(prisma!, {
        userId: memberId,
        spaceId,
      });

      const res = await req
        .get(`/reservations?spaceId=${spaceId}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      const found = res.body.find((r: { id: string }) => r.id === reservation.id);
      expect(found).toBeTruthy();
    });

    it('admin filtre par userId', async () => {
      const { reservation } = await createTestReservation(prisma!, {
        userId: memberId,
        spaceId,
      });

      const res = await req
        .get(`/reservations?userId=${memberId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      const found = res.body.find((r: { id: string }) => r.id === reservation.id);
      expect(found).toBeTruthy();
    });

    it('retourne 401 sans token', async () => {
      await req.get('/reservations').expect(401);
    });

    it('n\'inclut pas les réservations annulées (soft delete)', async () => {
      const { reservation } = await createTestReservation(prisma!, {
        userId: memberId,
        spaceId,
      });

      await req
        .patch(`/reservations/${reservation.id}/annuler`)
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(200);

      const res = await req
        .get('/reservations')
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(200);

      const found = res.body.find((r: { id: string }) => r.id === reservation.id);
      expect(found).toBeUndefined();
    });
  });

  describe('GET /reservations/:id', () => {
    it('retourne le détail d\'une réservation existante', async () => {
      const { reservation } = await createTestReservation(prisma!, {
        userId: memberId,
        spaceId,
        title: `it-detail-${Date.now()}`,
      });

      const res = await req
        .get(`/reservations/${reservation.id}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(200);

      expect(res.body).toMatchObject({
        id: reservation.id,
        title: expect.stringContaining('it-detail-'),
      });
      expect(res.body).toHaveProperty('spaceId');
      expect(res.body).toHaveProperty('startDatetime');
      expect(res.body).toHaveProperty('endDatetime');
    });

    it('retourne 404 si id inexistant', async () => {
      await req
        .get(`/reservations/${FAKE_ID}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(404);
    });

    it('retourne 401 sans token', async () => {
      const { reservation } = await createTestReservation(prisma!, {
        userId: memberId,
        spaceId,
      });

      await req.get(`/reservations/${reservation.id}`).expect(401);
    });

    it('retourne 404 si réservation annulée (soft delete)', async () => {
      const { reservation } = await createTestReservation(prisma!, {
        userId: memberId,
        spaceId,
      });

      await req
        .patch(`/reservations/${reservation.id}/annuler`)
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(200);

      await req
        .get(`/reservations/${reservation.id}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(404);
    });
  });

  describe('PATCH /reservations/:id', () => {
    it('met à jour une réservation', async () => {
      const slotStart = new Date(Date.now() + 900 * 60 * 60 * 1000);
      const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000);
      const { reservation } = await createTestReservation(prisma!, {
        userId: memberId,
        spaceId: spaceIdB,
        startDatetime: slotStart,
        endDatetime: slotEnd,
        title: `it-update-${Date.now()}`,
      });

      const res = await req
        .patch(`/reservations/${reservation.id}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ title: 'Réunion modifiée' })
        .expect(200);

      expect(res.body.title).toBe('Réunion modifiée');
    });

    it('retourne 404 si id inexistant', async () => {
      await req
        .patch(`/reservations/${FAKE_ID}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ title: 'Test' })
        .expect(404);
    });

    it('retourne 401 sans token', async () => {
      const { reservation } = await createTestReservation(prisma!, {
        userId: memberId,
        spaceId,
      });

      await req
        .patch(`/reservations/${reservation.id}`)
        .send({ title: 'Test' })
        .expect(401);
    });

    it('retourne 403 si pas propriétaire', async () => {
      const { reservation } = await createTestReservation(prisma!, {
        userId: adminId,
        spaceId,
      });

      await req
        .patch(`/reservations/${reservation.id}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ title: 'Test' })
        .expect(403);
    });

    it('retourne 409 si end <= start dans le body', async () => {
      const { reservation } = await createTestReservation(prisma!, {
        userId: memberId,
        spaceId,
      });
      const start = new Date(Date.now() + 48 * 60 * 60 * 1000);
      const end = new Date(start.getTime() - 60 * 60 * 1000);

      const res = await req
        .patch(`/reservations/${reservation.id}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          startDatetime: toIso(start),
          endDatetime: toIso(end),
        })
        .expect(409);

      expect(res.body.message).toContain('date de fin');
    });

    it('retourne 409 si chevauchement', async () => {
      const baseStart = new Date(Date.now() + 120 * 60 * 60 * 1000);
      const baseEnd = new Date(baseStart.getTime() + 60 * 60 * 1000);

      await createTestReservation(prisma!, {
        userId: adminId,
        spaceId,
        startDatetime: baseStart,
        endDatetime: baseEnd,
      });

      const { reservation } = await createTestReservation(prisma!, {
        userId: memberId,
        spaceId,
        startDatetime: new Date(baseStart.getTime() + 24 * 60 * 60 * 1000),
        endDatetime: new Date(baseEnd.getTime() + 24 * 60 * 60 * 1000),
      });

      const res = await req
        .patch(`/reservations/${reservation.id}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          startDatetime: toIso(baseStart),
          endDatetime: toIso(baseEnd),
        })
        .expect(409);

      expect(res.body.message).toContain('chevauche');
    });
  });

  describe('PATCH /reservations/:id/annuler', () => {
    it('annule une réservation', async () => {
      const { reservation } = await createTestReservation(prisma!, {
        userId: memberId,
        spaceId,
      });

      const res = await req
        .patch(`/reservations/${reservation.id}/annuler`)
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('retourne 404 si id inexistant', async () => {
      await req
        .patch(`/reservations/${FAKE_ID}/annuler`)
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(404);
    });

    it('retourne 401 sans token', async () => {
      const { reservation } = await createTestReservation(prisma!, {
        userId: memberId,
        spaceId,
      });

      await req.patch(`/reservations/${reservation.id}/annuler`).expect(401);
    });

    it('retourne 403 si pas propriétaire', async () => {
      const { reservation } = await createTestReservation(prisma!, {
        userId: adminId,
        spaceId,
      });

      await req
        .patch(`/reservations/${reservation.id}/annuler`)
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(403);
    });

    it('annule toute la série récurrente avec scope=all', async () => {
      const start = new Date(Date.now() + 700 * 60 * 60 * 1000);
      const end = new Date(start.getTime() + 60 * 60 * 1000);
      const recurrenceEndAt = new Date(start.getTime() + 72 * 60 * 60 * 1000);

      const createRes = await req
        .post('/reservations')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          spaceId: spaceIdC,
          startDatetime: toIso(start),
          endDatetime: toIso(end),
          recurrenceRule: 'FREQ=DAILY',
          recurrenceEndAt: toIso(recurrenceEndAt),
          title: `it-recur-cancel-${Date.now()}`,
        })
        .expect(201);

      const firstId = createRes.body.first.id;
      expect(createRes.body.created).toBeGreaterThanOrEqual(1);

      const cancelRes = await req
        .patch(`/reservations/${firstId}/annuler?scope=all`)
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(200);

      expect(cancelRes.body.success).toBe(true);

      const listRes = await req
        .get(`/reservations?spaceId=${spaceIdC}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(200);

      const found = listRes.body.find((r: { id: string }) => r.id === firstId);
      expect(found).toBeUndefined();
    });
  });
});
