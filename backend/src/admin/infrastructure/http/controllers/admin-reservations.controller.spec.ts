import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { PrismaModule } from '../../../../database/prisma.module';
import { PrismaService } from '../../../../database/prisma.service';
import { AdminModule } from '../../../admin.module';
import { AuthModule } from '../../../../auth/auth.module';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';

describe('AdminReservationsController (e2e-like)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let spaceId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule, AuthModule, AdminModule],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: any) => {
          const req = context.switchToHttp().getRequest();
          req.user = {
            userId: 'admin-test-id',
            email: 'admin-resa@test.com',
            role: 'admin',
          };
          return true;
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = moduleFixture.get(PrismaService);

    const adminRole = await prisma.role.findUnique({ where: { slug: 'admin' } });
    if (!adminRole) throw new Error('Rôle admin manquant');

    const admin = await prisma.user.create({
      data: {
        firstname: 'Admin',
        lastname: 'Reservations',
        email: `admin-resa-${Date.now()}@test.com`,
        password: 'hash',
        isActive: true,
        approvedAt: new Date(),
        roleId: adminRole.id,
      },
    });

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: admin.email, password: 'password123' });
    adminToken = loginRes.body?.access_token ?? '';

    const space = await prisma.space.create({
      data: {
        name: `Salle admin-resa ${Date.now()}`,
        code: `AR-${Date.now()}`,
        type: 'MEETING_ROOM',
        capacity: 4,
        status: 'AVAILABLE',
      },
    });
    spaceId = space.id;
  });

  afterAll(async () => {
    await prisma.reservation.deleteMany({ where: { spaceId } });
    await prisma.space.delete({ where: { id: spaceId } });
    await prisma.user.deleteMany({
      where: { email: { startsWith: 'admin-resa-' } },
    });
    await app.close();
  });

  it('retourne un PDF avec les bons headers pour la route admin export', async () => {
    const res = await request(app.getHttpServer())
      .get(`/admin/spaces/${spaceId}/reservations/export`)
      .query({
        from: '2026-01-01',
        to: '2026-12-31',
      })
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.headers['content-type']).toBe('application/pdf');
    expect(res.headers['content-disposition']).toContain('attachment; filename=');
    expect(res.body).toBeInstanceOf(Buffer);
  });
});

