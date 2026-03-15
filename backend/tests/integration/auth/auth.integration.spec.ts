import { PrismaService } from '../../../src/database/prisma.service';
import { createTestApp, getAuthToken } from '../setup/test-app';
import { cleanupAuthData } from '../setup/test-db';
import {
  createTestUser,
  createEmailVerificationToken,
  createPasswordResetToken,
} from '../setup/fixtures/auth.fixtures';

describe('Auth (intégration)', () => {
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

  describe('POST /auth/login', () => {
    it('retourne un access_token si email et mot de passe valides', async () => {
      const res = await req
        .post('/auth/login')
        .send({ email: 'admin@test.com', password: 'password123' })
        .expect(201);

      expect(res.body).toHaveProperty('access_token');
      expect(typeof res.body.access_token).toBe('string');
      expect(res.body.access_token.length).toBeGreaterThan(10);
    });

    it('retourne 401 si email inexistant', async () => {
      await req
        .post('/auth/login')
        .send({ email: 'inconnu@test.com', password: 'password123' })
        .expect(401);
    });

    it('retourne 401 si mot de passe incorrect', async () => {
      await req
        .post('/auth/login')
        .send({ email: 'admin@test.com', password: 'wrong' })
        .expect(401);
    });

    it('retourne 401 si utilisateur inactif', async () => {
      const { user } = await createTestUser(prisma!, {
        email: `it-inactive-${Date.now()}@test.com`,
        isActive: false,
      });

      await req
        .post('/auth/login')
        .send({ email: user.email, password: 'password123' })
        .expect(401);
    });
  });

  describe('GET /auth/me', () => {
    it('retourne le profil si token valide', async () => {
      const token = await getAuthToken(req, 'admin@test.com', 'password123');

      const res = await req
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body).toMatchObject({
        email: 'admin@test.com',
        firstname: 'Admin',
        lastname: 'Test',
      });
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('role');
      expect(res.body.role).toHaveProperty('slug', 'admin');
    });

    it('retourne 401 sans header Authorization', async () => {
      await req.get('/auth/me').expect(401);
    });

    it('retourne 401 avec token invalide', async () => {
      await req
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('POST /auth/register', () => {
    it('crée un compte et retourne un message de confirmation', async () => {
      const email = `new-user-${Date.now()}@test.com`;

      const res = await req
        .post('/auth/register')
        .send({
          firstname: 'New',
          lastname: 'User',
          email,
          password: 'password123',
        })
        .expect(201);

      expect(res.body.message).toContain('Inscription enregistrée');
    });

    it('retourne 400 si email déjà utilisé', async () => {
      const email = `new-user-${Date.now()}@test.com`;

      await req
        .post('/auth/register')
        .send({
          firstname: 'New',
          lastname: 'User',
          email,
          password: 'password123',
        })
        .expect(201);

      await req
        .post('/auth/register')
        .send({
          firstname: 'New2',
          lastname: 'User2',
          email,
          password: 'password123',
        })
        .expect(400);
    });
  });

  describe('GET /auth/verify-email', () => {
    it('valide le token et retourne un message', async () => {
      const { user } = await createTestUser(prisma!, {
        email: `new-user-${Date.now()}@test.com`,
      });
      const token = await createEmailVerificationToken(prisma!, user.id);

      const res = await req
        .get(`/auth/verify-email?token=${token}`)
        .expect(200);

      expect(res.body.message).toContain('Email vérifié');
    });

    it('retourne message "déjà vérifié" si token déjà utilisé', async () => {
      const { user } = await createTestUser(prisma!, {
        email: `new-user-${Date.now()}@test.com`,
      });
      const token = await createEmailVerificationToken(prisma!, user.id);

      await prisma!.user.update({
        where: { id: user.id },
        data: { emailVerifiedAt: new Date() },
      });
      await prisma!.userToken.updateMany({
        where: { userId: user.id, token, type: 'EMAIL_VERIFICATION' },
        data: { deletedAt: new Date() },
      });

      const res = await req
        .get(`/auth/verify-email?token=${token}`)
        .expect(200);

      expect(res.body.message).toContain('déjà vérifié');
    });

    it('retourne 400 si token manquant', async () => {
      await req.get('/auth/verify-email').expect(400);
    });

    it('retourne 404 si token invalide', async () => {
      await req
        .get('/auth/verify-email?token=invalid-token-xyz')
        .expect(404);
    });
  });

  describe('PATCH /auth/me', () => {
    it('met à jour le profil et retourne l\'utilisateur', async () => {
      const token = await getAuthToken(req, 'member@test.com', 'password123');

      const res = await req
        .patch('/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .send({
          firstname: 'Updated',
          lastname: 'Name',
          phone: '0612345678',
        })
        .expect(200);

      expect(res.body.firstname).toBe('Updated');
      expect(res.body.lastname).toBe('Name');
      expect(res.body.phone).toBe('0612345678');
    });

    it('retourne 401 sans token', async () => {
      await req
        .patch('/auth/me')
        .send({ firstname: 'Test' })
        .expect(401);
    });
  });

  describe('POST /auth/change-password', () => {
    it('change le mot de passe avec succès', async () => {
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

      await req
        .post('/auth/login')
        .send({ email: user.email, password: 'newpassword456' })
        .expect(201);
    });

    it('retourne 400 si newPassword !== confirmPassword', async () => {
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
          confirmPassword: 'different',
        })
        .expect(400);
    });

    it('retourne 401 si mot de passe actuel incorrect', async () => {
      const { user, plainPassword } = await createTestUser(prisma!, {
        email: `it-changepwd-${Date.now()}@test.com`,
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

    it('retourne 401 sans token', async () => {
      await req
        .post('/auth/change-password')
        .send({
          currentPassword: 'password123',
          newPassword: 'newpassword456',
          confirmPassword: 'newpassword456',
        })
        .expect(401);
    });
  });

  describe('POST /auth/forgot-password', () => {
    it('retourne un message générique pour email existant', async () => {
      const res = await req
        .post('/auth/forgot-password')
        .send({ email: 'admin@test.com' })
        .expect(201);

      expect(res.body.message).toContain('Si un compte existe');
    });

    it('retourne le même message pour email inexistant', async () => {
      const res = await req
        .post('/auth/forgot-password')
        .send({ email: 'nonexistent@test.com' })
        .expect(201);

      expect(res.body.message).toContain('Si un compte existe');
    });
  });

  describe('POST /auth/reset-password', () => {
    it('réinitialise le mot de passe avec un token valide', async () => {
      const { user, plainPassword } = await createTestUser(prisma!, {
        email: `it-reset-${Date.now()}@test.com`,
      });
      const token = await createPasswordResetToken(prisma!, user.id);

      await req
        .post('/auth/reset-password')
        .send({ token, password: 'newpassword789' })
        .expect(201);

      await req
        .post('/auth/login')
        .send({ email: user.email, password: 'newpassword789' })
        .expect(201);
    });

    it('retourne 400 si token manquant', async () => {
      await req
        .post('/auth/reset-password')
        .send({ password: 'newpassword789' })
        .expect(400);
    });

    it('retourne 404 si token invalide', async () => {
      await req
        .post('/auth/reset-password')
        .send({ token: 'invalid-token', password: 'newpassword789' })
        .expect(404);
    });
  });
});
