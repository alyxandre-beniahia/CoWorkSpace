import { Test, TestingModule } from '@nestjs/testing';
import { PrismaModule } from '../../../database/prisma.module';
import { PrismaService } from '../../../database/prisma.service';
import { AdminModule } from '../../admin.module';
import { ListMembersUseCase } from './list-members.use-case';

describe('ListMembersUseCase', () => {
  let useCase: ListMembersUseCase;
  let prisma: PrismaService;
  let memberRoleId: string;
  let pendingUserId: string;
  let approvedUserId: string;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule, AdminModule],
    }).compile();

    useCase = module.get(ListMembersUseCase);
    prisma = module.get(PrismaService);

    const memberRole = await prisma.role.findUnique({ where: { slug: 'member' } });
    if (!memberRole) throw new Error('Rôle member manquant pour les tests');
    memberRoleId = memberRole.id;

    const pendingUser = await prisma.user.create({
      data: {
        firstname: 'Pending',
        lastname: 'User',
        email: `list-pending-${Date.now()}@test.com`,
        password: 'hash',
        isActive: false,
        emailVerifiedAt: new Date(),
        approvedAt: null,
        approvedById: null,
        roleId: memberRoleId,
      },
    });
    pendingUserId = pendingUser.id;

    const admin = await prisma.user.findFirst({ where: { email: 'admin@test.com' }, select: { id: true } });
    if (!admin) throw new Error('Admin seed manquant');

    const approvedUser = await prisma.user.create({
      data: {
        firstname: 'Approved',
        lastname: 'Member',
        email: `list-approved-${Date.now()}@test.com`,
        password: 'hash',
        isActive: true,
        emailVerifiedAt: new Date(),
        approvedAt: new Date(),
        approvedById: admin.id,
        roleId: memberRoleId,
      },
    });
    approvedUserId = approvedUser.id;
  });

  afterEach(async () => {
    await prisma.user.deleteMany({
      where: { email: { startsWith: 'list-pending-' } },
    });
    await prisma.user.deleteMany({
      where: { email: { startsWith: 'list-approved-' } },
    });
  });

  it('filter=pending retourne uniquement les membres en attente (emailVerifiedAt non null, approvedAt null)', async () => {
    const result = await useCase.run({ filter: 'pending' });
    expect(Array.isArray(result)).toBe(true);
    const ids = result.map((u) => u.id);
    expect(ids).toContain(pendingUserId);
    expect(ids).not.toContain(approvedUserId);
    const pending = result.find((u) => u.id === pendingUserId);
    expect(pending?.approvedAt).toBeNull();
    expect(pending?.emailVerifiedAt).not.toBeNull();
  });

  it('filter=members retourne uniquement les membres validés (approvedAt non null)', async () => {
    const result = await useCase.run({ filter: 'members' });
    expect(Array.isArray(result)).toBe(true);
    const ids = result.map((u) => u.id);
    expect(ids).toContain(approvedUserId);
    expect(ids).not.toContain(pendingUserId);
    const approved = result.find((u) => u.id === approvedUserId);
    expect(approved?.approvedAt).not.toBeNull();
  });

  it('filter=all retourne tous les users avec rôle member', async () => {
    const result = await useCase.run({ filter: 'all' });
    expect(Array.isArray(result)).toBe(true);
    const ids = result.map((u) => u.id);
    expect(ids).toContain(pendingUserId);
    expect(ids).toContain(approvedUserId);
  });

  it("retourne un tableau vide si le rôle member n'existe pas", async () => {
    const prismaMock = {
      ...prisma,
      role: { findUnique: jest.fn().mockResolvedValue(null) },
    };
    const moduleRef = await Test.createTestingModule({
      imports: [PrismaModule, AdminModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .compile();
    const listUseCase = moduleRef.get(ListMembersUseCase);
    const result = await listUseCase.run({ filter: 'all' });
    expect(result).toEqual([]);
  });
});
