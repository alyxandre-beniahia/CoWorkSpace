import { Test, TestingModule } from '@nestjs/testing';
import { PrismaModule } from '../../../database/prisma.module';
import { PrismaService } from '../../../database/prisma.service';
import { AdminModule } from '../../admin.module';
import { ValidateRegistrationUseCase } from './validate-registration.use-case';
import { AdminForbiddenError, AdminNotFoundError } from '../../domain/errors/admin.errors';

describe('ValidateRegistrationUseCase', () => {
  let useCase: ValidateRegistrationUseCase;
  let prisma: PrismaService;
  let pendingUserId: string;
  let adminUserId: string;
  const pendingEmail = `validate-pending-${Date.now()}@test.com`;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule, AdminModule],
    }).compile();

    useCase = module.get(ValidateRegistrationUseCase);
    prisma = module.get(PrismaService);

    const memberRole = await prisma.role.findUnique({ where: { slug: 'member' } });
    if (!memberRole) throw new Error('Rôle member manquant');
    const admin = await prisma.user.findFirst({ where: { email: 'admin@test.com' }, select: { id: true } });
    if (!admin) throw new Error('Admin seed manquant');
    adminUserId = admin.id;

    const pendingUser = await prisma.user.create({
      data: {
        firstname: 'Pending',
        lastname: 'User',
        email: pendingEmail,
        password: 'hash',
        isActive: false,
        emailVerifiedAt: new Date(),
        approvedAt: null,
        approvedById: null,
        roleId: memberRole.id,
      },
    });
    pendingUserId = pendingUser.id;
  });

  afterEach(async () => {
    await prisma.user.deleteMany({
      where: { email: pendingEmail },
    });
  });

  it('valide une inscription', async () => {
    const result = await useCase.run(pendingUserId, adminUserId);
    expect(result.message).toContain('validée');

    const user = await prisma.user.findUnique({ where: { id: pendingUserId } });
    expect(user?.approvedAt).not.toBeNull();
    expect(user?.approvedById).toBe(adminUserId);
    expect(user?.isActive).toBe(true);
  });

  it('lance AdminNotFoundError si userId inexistant', async () => {
    await expect(useCase.run('unknown-id', adminUserId)).rejects.toThrow(AdminNotFoundError);
  });

  it('lance AdminForbiddenError si inscription déjà validée', async () => {
    await prisma.user.update({
      where: { id: pendingUserId },
      data: { approvedAt: new Date(), approvedById: adminUserId, isActive: true },
    });
    await expect(useCase.run(pendingUserId, adminUserId)).rejects.toThrow(AdminForbiddenError);
  });

  it('lance AdminForbiddenError si email pas encore vérifié', async () => {
    await prisma.user.update({
      where: { id: pendingUserId },
      data: { emailVerifiedAt: null },
    });
    await expect(useCase.run(pendingUserId, adminUserId)).rejects.toThrow(AdminForbiddenError);
  });
});
