import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaModule } from '../../database/prisma.module';
import { PrismaService } from '../../database/prisma.service';
import { EmailService } from '../../notification/infrastructure/email.service';
import { AdminModule } from '../admin.module';
import { ValidateRegistrationUseCase } from './validate-registration.use-case';

describe('ValidateRegistrationUseCase', () => {
  let useCase: ValidateRegistrationUseCase;
  let prisma: PrismaService;
  let emailService: EmailService;
  let pendingUserId: string;
  let adminUserId: string;
  const pendingEmail = `validate-pending-${Date.now()}@test.com`;

  beforeEach(async () => {
    const mockEmailService = {
      sendRegistrationApprovedEmail: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule, AdminModule],
    })
      .overrideProvider(EmailService)
      .useValue(mockEmailService)
      .compile();

    useCase = module.get(ValidateRegistrationUseCase);
    prisma = module.get(PrismaService);
    emailService = module.get(EmailService);

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

  it('valide une inscription et appelle sendRegistrationApprovedEmail', async () => {
    const result = await useCase.run(pendingUserId, adminUserId);
    expect(result.message).toContain('validée');

    const user = await prisma.user.findUnique({ where: { id: pendingUserId } });
    expect(user?.approvedAt).not.toBeNull();
    expect(user?.approvedById).toBe(adminUserId);
    expect(user?.isActive).toBe(true);

    expect(emailService.sendRegistrationApprovedEmail).toHaveBeenCalledTimes(1);
    expect(emailService.sendRegistrationApprovedEmail).toHaveBeenCalledWith(pendingEmail);
  });

  it('lance NotFoundException si userId inexistant', async () => {
    await expect(useCase.run('unknown-id', adminUserId)).rejects.toThrow(NotFoundException);
  });

  it('lance ForbiddenException si inscription déjà validée', async () => {
    await prisma.user.update({
      where: { id: pendingUserId },
      data: { approvedAt: new Date(), approvedById: adminUserId, isActive: true },
    });
    await expect(useCase.run(pendingUserId, adminUserId)).rejects.toThrow(ForbiddenException);
  });

  it('lance ForbiddenException si email pas encore vérifié', async () => {
    await prisma.user.update({
      where: { id: pendingUserId },
      data: { emailVerifiedAt: null },
    });
    await expect(useCase.run(pendingUserId, adminUserId)).rejects.toThrow(ForbiddenException);
  });
});
