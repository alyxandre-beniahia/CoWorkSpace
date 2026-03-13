import { PrismaService } from '../../../src/prisma/prisma.service';
import { createTestApp, getAuthToken } from '../setup/test-app';
import { cleanupAuthData, cleanupAdminData } from '../setup/test-db';
import { createTestUser } from '../setup/fixtures/auth.fixtures';
import {
  createPendingMember,
  createMemberUnverified,
  createTestSpace,
  createTestEquipement,
} from '../setup/fixtures/admin.fixtures';

const FAKE_ID = 'clnonexistentid12345678901234';

describe('Admin (intégration)', () => {
  let app: Awaited<ReturnType<typeof createTestApp>>['app'];
  let req: Awaited<ReturnType<typeof createTestApp>>['request'];
  let prisma: PrismaService | undefined;
  let adminToken: string;
  let memberToken: string;

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    req = testApp.request;
    prisma = app.get(PrismaService);
    adminToken = await getAuthToken(req, 'admin@test.com', 'password123');
    memberToken = await getAuthToken(req, 'member@test.com', 'password123');
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

  describe('GET /admin/membres', () => {
    it('retourne la liste des membres avec filter=all', async () => {
      const res = await req
        .get('/admin/membres?filter=all')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('retourne les membres en attente avec filter=pending', async () => {
      const { user } = await createPendingMember(prisma!);

      const res = await req
        .get('/admin/membres?filter=pending')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      const found = res.body.find((m: { id: string }) => m.id === user.id);
      expect(found).toBeTruthy();
    });

    it('retourne les membres validés avec filter=members', async () => {
      const res = await req
        .get('/admin/membres?filter=members')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('retourne 401 sans token', async () => {
      await req.get('/admin/membres').expect(401);
    });

    it('retourne 403 avec token member', async () => {
      await req
        .get('/admin/membres')
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(403);
    });
  });

  describe('PATCH /admin/membres/:id/valider', () => {
    it('valide une inscription en attente', async () => {
      const { user } = await createPendingMember(prisma!);

      const res = await req
        .patch(`/admin/membres/${user.id}/valider`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.message).toContain('validée');
    });

    it('retourne 404 si id inexistant', async () => {
      await req
        .patch(`/admin/membres/${FAKE_ID}/valider`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('retourne 403 si id d\'un admin', async () => {
      const admin = await prisma!.user.findUnique({
        where: { email: 'admin@test.com' },
        select: { id: true },
      });
      if (!admin) throw new Error('Admin not found');

      await req
        .patch(`/admin/membres/${admin.id}/valider`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(403);
    });

    it('retourne 403 si member déjà validé', async () => {
      const { user } = await createTestUser(prisma!, {
        email: `it-validated-${Date.now()}@test.com`,
        roleSlug: 'member',
      });

      await req
        .patch(`/admin/membres/${user.id}/valider`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(403);
    });

    it('retourne 403 si member sans emailVerifiedAt', async () => {
      const { user } = await createMemberUnverified(prisma!);

      await req
        .patch(`/admin/membres/${user.id}/valider`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(403);
    });

    it('retourne 403 avec token member', async () => {
      const { user } = await createPendingMember(prisma!);

      await req
        .patch(`/admin/membres/${user.id}/valider`)
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(403);
    });
  });

  describe('PATCH /admin/membres/:id/refuser', () => {
    it('refuse une inscription en attente', async () => {
      const { user } = await createPendingMember(prisma!);

      const res = await req
        .patch(`/admin/membres/${user.id}/refuser`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.message).toContain('refusée');
    });

    it('retourne 404 si id inexistant', async () => {
      await req
        .patch(`/admin/membres/${FAKE_ID}/refuser`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('retourne 403 si member déjà validé', async () => {
      const { user } = await createTestUser(prisma!, {
        email: `it-validated-${Date.now()}@test.com`,
        roleSlug: 'member',
      });

      await req
        .patch(`/admin/membres/${user.id}/refuser`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(403);
    });

    it('retourne 403 avec token member', async () => {
      const { user } = await createPendingMember(prisma!);

      await req
        .patch(`/admin/membres/${user.id}/refuser`)
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(403);
    });
  });

  describe('PATCH /admin/membres/:id/actif', () => {
    it('active un membre avec actif=true', async () => {
      const { user } = await createTestUser(prisma!, {
        email: `it-inactive-${Date.now()}@test.com`,
        roleSlug: 'member',
        isActive: false,
      });

      const res = await req
        .patch(`/admin/membres/${user.id}/actif?actif=true`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.isActive).toBe(true);
    });

    it('désactive un membre avec actif=false', async () => {
      const { user } = await createTestUser(prisma!, {
        email: `it-active-${Date.now()}@test.com`,
        roleSlug: 'member',
      });

      const res = await req
        .patch(`/admin/membres/${user.id}/actif?actif=false`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.isActive).toBe(false);
    });

    it('retourne 404 si id inexistant', async () => {
      await req
        .patch(`/admin/membres/${FAKE_ID}/actif?actif=true`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('retourne 403 si id d\'un admin', async () => {
      const admin = await prisma!.user.findUnique({
        where: { email: 'admin@test.com' },
        select: { id: true },
      });
      if (!admin) throw new Error('Admin not found');

      await req
        .patch(`/admin/membres/${admin.id}/actif?actif=false`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(403);
    });

    it('retourne 403 avec token member', async () => {
      const { user } = await createTestUser(prisma!, {
        email: `it-member-${Date.now()}@test.com`,
        roleSlug: 'member',
      });

      await req
        .patch(`/admin/membres/${user.id}/actif?actif=false`)
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(403);
    });
  });

  describe('GET /admin/espaces', () => {
    it('retourne la liste des espaces', async () => {
      const res = await req
        .get('/admin/espaces')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('retourne 403 avec token member', async () => {
      await req
        .get('/admin/espaces')
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(403);
    });
  });

  describe('POST /admin/espaces', () => {
    it('crée un espace', async () => {
      const res = await req
        .post('/admin/espaces')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Salle test',
          type: 'MEETING_ROOM',
          capacity: 8,
        })
        .expect(201);

      expect(res.body).toMatchObject({
        name: 'Salle test',
        type: 'MEETING_ROOM',
        capacity: 8,
      });
      expect(res.body).toHaveProperty('id');
    });

    it('retourne 403 avec token member', async () => {
      await req
        .post('/admin/espaces')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          name: 'Salle test',
          type: 'MEETING_ROOM',
          capacity: 8,
        })
        .expect(403);
    });
  });

  describe('PATCH /admin/espaces/:id', () => {
    it('met à jour un espace', async () => {
      const { space } = await createTestSpace(prisma!, {
        name: 'Espace initial',
        type: 'MEETING_ROOM',
        capacity: 6,
      });

      const res = await req
        .patch(`/admin/espaces/${space.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Espace modifié', capacity: 10 })
        .expect(200);

      expect(res.body.name).toBe('Espace modifié');
      expect(res.body.capacity).toBe(10);
    });

    it('retourne 500 si id inexistant (Prisma record not found)', async () => {
      await req
        .patch(`/admin/espaces/${FAKE_ID}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Test' })
        .expect(500);
    });

    it('retourne 403 avec token member', async () => {
      const { space } = await createTestSpace(prisma!);

      await req
        .patch(`/admin/espaces/${space.id}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ name: 'Test' })
        .expect(403);
    });
  });

  describe('DELETE /admin/espaces/:id', () => {
    it('supprime un espace', async () => {
      const { space } = await createTestSpace(prisma!);

      const res = await req
        .delete(`/admin/espaces/${space.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toEqual({ deleted: true });
    });

    it('retourne 500 si id inexistant (Prisma record not found)', async () => {
      await req
        .delete(`/admin/espaces/${FAKE_ID}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(500);
    });

    it('retourne 403 avec token member', async () => {
      const { space } = await createTestSpace(prisma!);

      await req
        .delete(`/admin/espaces/${space.id}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(403);
    });
  });

  describe('POST /admin/espaces/:id/equipements', () => {
    it('associe un équipement à un espace', async () => {
      const { space } = await createTestSpace(prisma!);
      const { equipement } = await createTestEquipement(prisma!);

      const res = await req
        .post(`/admin/espaces/${space.id}/equipements`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ equipementId: equipement.id })
        .expect(201);

      expect(res.body).toHaveProperty('spaceId', space.id);
      expect(res.body).toHaveProperty('equipementId', equipement.id);
    });

    it('retourne 403 avec token member', async () => {
      const { space } = await createTestSpace(prisma!);
      const { equipement } = await createTestEquipement(prisma!);

      await req
        .post(`/admin/espaces/${space.id}/equipements`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ equipementId: equipement.id })
        .expect(403);
    });
  });

  describe('DELETE /admin/espaces/:id/equipements/:equipementId', () => {
    it('supprime l\'association équipement-espace', async () => {
      const { space } = await createTestSpace(prisma!);
      const { equipement } = await createTestEquipement(prisma!);

      await prisma!.spaceEquipement.create({
        data: { spaceId: space.id, equipementId: equipement.id },
      });

      const res = await req
        .delete(`/admin/espaces/${space.id}/equipements/${equipement.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toEqual({ deleted: true });
    });

    it('retourne 403 avec token member', async () => {
      const { space } = await createTestSpace(prisma!);
      const { equipement } = await createTestEquipement(prisma!);

      await prisma!.spaceEquipement.create({
        data: { spaceId: space.id, equipementId: equipement.id },
      });

      await req
        .delete(`/admin/espaces/${space.id}/equipements/${equipement.id}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(403);
    });
  });
});
