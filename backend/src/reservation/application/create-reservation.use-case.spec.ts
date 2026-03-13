import { Test, type TestingModule } from '@nestjs/testing';
import { PrismaModule } from '../../prisma/prisma.module';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReservationUseCase } from './create-reservation.use-case';

describe('CreateReservationUseCase', () => {
  let useCase: CreateReservationUseCase;
  let prisma: PrismaService;
  let spaceId: string;
  let userId: string;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule],
      providers: [CreateReservationUseCase],
    }).compile();

    useCase = module.get(CreateReservationUseCase);
    prisma = module.get(PrismaService);

    const space = await prisma.space.create({
      data: {
        name: 'Salle test réservation',
        type: 'MEETING_ROOM',
        capacity: 4,
        status: 'AVAILABLE',
      },
    });
    spaceId = space.id;

    const user = await prisma.user.create({
      data: {
        firstname: 'Test',
        lastname: 'User',
        email: `test-reservation-${Date.now()}@example.com`,
        password: 'hashed',
        role: {
          connectOrCreate: {
            where: { slug: 'member' },
            create: { name: 'Membre', slug: 'member' },
          },
        },
      },
    });
    userId = user.id;
  });

  afterAll(async () => {
    await prisma.reservation.deleteMany({ where: { spaceId } });
    await prisma.space.deleteMany({ where: { id: spaceId } });
  });

  it('crée une réservation sans conflit', async () => {
    const start = new Date();
    const end = new Date(start.getTime() + 60 * 60 * 1000);

    const res = await useCase.run({
      spaceId,
      userId,
      startDatetime: start,
      endDatetime: end,
      isPrivate: false,
      title: 'Test',
    });

    expect(res).toBeDefined();
    expect(res.spaceId).toBe(spaceId);
  });
});

