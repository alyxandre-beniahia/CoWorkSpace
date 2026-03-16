import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaModule } from '../../../database/prisma.module';
import { PrismaService } from '../../../database/prisma.service';
import { ReservationModule } from '../../reservation.module';
import { ExportSpaceReservationsPdfUseCase } from './export-space-reservations-pdf.use-case';

describe('ExportSpaceReservationsPdfUseCase', () => {
  let useCase: ExportSpaceReservationsPdfUseCase;
  let prisma: PrismaService;
  let spaceId: string;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule, ReservationModule],
    }).compile();

    useCase = module.get(ExportSpaceReservationsPdfUseCase);
    prisma = module.get(PrismaService);

    const space = await prisma.space.create({
      data: {
        name: `Salle export ${Date.now()}`,
        code: `EXP-${Date.now()}`,
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
  });

  it('lève ForbiddenException pour un non-admin', async () => {
    await expect(
      useCase.run({
        requesterRole: 'member',
        spaceId,
        from: new Date('2026-01-01T00:00:00Z'),
        to: new Date('2026-12-31T23:59:59Z'),
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('génère un buffer PDF et un nom de fichier pour un admin', async () => {
    const from = new Date('2026-01-01T00:00:00Z');
    const to = new Date('2026-12-31T23:59:59Z');

    const result = await useCase.run({
      requesterRole: 'admin',
      spaceId,
      from,
      to,
    });

    expect(result.filename).toContain('reservations-');
    expect(Buffer.isBuffer(result.buffer)).toBe(true);
    expect(result.buffer.length).toBeGreaterThan(0);
  });
});

