import { PrismaService } from '../../../src/database/prisma.service';
import { createTestApp } from '../setup/test-app';
import { cleanupAdminData } from '../setup/test-db';
import { createTestSpace, createTestEquipement } from '../setup/fixtures/admin.fixtures';

const FAKE_ID = 'clnonexistentid12345678901234';

describe('Space (intégration)', () => {
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
    if (prisma) await cleanupAdminData(prisma);
  });

  describe('GET /spaces/equipments', () => {
    it('retourne la liste des équipements', async () => {
      const { equipement } = await createTestEquipement(prisma!);

      const res = await req.get('/spaces/equipments').expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      const found = res.body.find((e: { id: string }) => e.id === equipement.id);
      expect(found).toBeTruthy();
      expect(found).toMatchObject({ id: equipement.id, name: equipement.name });
    });
  });

  describe('GET /spaces', () => {
    it('retourne la liste des espaces', async () => {
      const res = await req.get('/spaces').expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      const first = res.body[0];
      expect(first).toHaveProperty('id');
      expect(first).toHaveProperty('name');
      expect(first).toHaveProperty('code');
      expect(first).toHaveProperty('type');
      expect(first).toHaveProperty('capacity');
      expect(first).toHaveProperty('status');
      expect(first).toHaveProperty('equipements');
    });

    it('filtre par type=MEETING_ROOM', async () => {
      const res = await req.get('/spaces?type=MEETING_ROOM').expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      res.body.forEach((s: { type: string }) => {
        expect(s.type).toBe('MEETING_ROOM');
      });
    });

    it('filtre par type=OPEN_SPACE', async () => {
      const res = await req.get('/spaces?type=OPEN_SPACE').expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      res.body.forEach((s: { type: string }) => {
        expect(s.type).toBe('OPEN_SPACE');
      });
    });

    it('filtre par capacityMin=10', async () => {
      const res = await req.get('/spaces?capacityMin=10').expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      res.body.forEach((s: { capacity: number }) => {
        expect(s.capacity).toBeGreaterThanOrEqual(10);
      });
    });

    it('filtre par capacityMax=8', async () => {
      const res = await req.get('/spaces?capacityMax=8').expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      res.body.forEach((s: { capacity: number }) => {
        expect(s.capacity).toBeLessThanOrEqual(8);
      });
    });

    it('filtre par equipementId', async () => {
      const { space } = await createTestSpace(prisma!, {
        type: 'MEETING_ROOM',
        capacity: 6,
      });
      const { equipement } = await createTestEquipement(prisma!);

      await prisma!.spaceEquipement.create({
        data: { spaceId: space.id, equipementId: equipement.id },
      });

      const res = await req
        .get(`/spaces?equipementId=${equipement.id}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      const found = res.body.find((s: { id: string }) => s.id === space.id);
      expect(found).toBeTruthy();
      expect(found.equipements).toContain(equipement.name);
    });
  });

  describe('GET /spaces/:id', () => {
    it('retourne le détail d\'un espace existant', async () => {
      const { space } = await createTestSpace(prisma!, {
        name: 'Salle test détail',
        type: 'MEETING_ROOM',
        capacity: 8,
        description: 'Description test',
      });

      const res = await req.get(`/spaces/${space.id}`).expect(200);

      expect(res.body).toMatchObject({
        id: space.id,
        name: 'Salle test détail',
        type: 'MEETING_ROOM',
        capacity: 8,
        description: 'Description test',
      });
      expect(res.body).toHaveProperty('code');
      expect(res.body).toHaveProperty('status');
      expect(res.body).toHaveProperty('positionX');
      expect(res.body).toHaveProperty('positionY');
      expect(res.body).toHaveProperty('equipements');
      expect(Array.isArray(res.body.equipements)).toBe(true);
    });

    it('retourne 404 si id inexistant', async () => {
      await req.get(`/spaces/${FAKE_ID}`).expect(404);
    });
  });
});
