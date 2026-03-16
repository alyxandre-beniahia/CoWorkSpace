import { Test, TestingModule } from '@nestjs/testing';
import { PrismaModule } from '../../../database/prisma.module';
import { PrismaService } from '../../../database/prisma.service';
import { ReservationModule } from '../../reservation.module';
import { ExportMyReservationsPdfUseCase } from './export-my-reservations-pdf.use-case';

describe('ExportMyReservationsPdfUseCase', () => {
  let useCase: ExportMyReservationsPdfUseCase;
  let prisma: PrismaService;
  let userId: string;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule, ReservationModule],
    }).compile();

    useCase = module.get(ExportMyReservationsPdfUseCase);
    prisma = module.get(PrismaService);

    const memberRole = await prisma.role.findUnique({ where: { slug: 'member' } });
    if (!memberRole) throw new Error('Rôle member manquant');

    const user = await prisma.user.create({
      data: {
        firstname: 'Export',
        lastname: 'User',
        email: `export-user-${Date.now()}@test.com`,
        password: 'hash',
        isActive: true,
        approvedAt: new Date(),
        roleId: memberRole.id,
      },
    });
    userId = user.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { startsWith: 'export-user-' } },
    });
  });

  it("génère un buffer PDF et un nom de fichier pour l'utilisateur", async () => {
    const from = new Date('2026-01-01T00:00:00Z');
    const to = new Date('2026-12-31T23:59:59Z');

    const result = await useCase.run({ userId, from, to });

    expect(result.filename).toContain('mes-reservations-');
    expect(Buffer.isBuffer(result.buffer)).toBe(true);
    expect(result.buffer.length).toBeGreaterThan(0);
  });
});

