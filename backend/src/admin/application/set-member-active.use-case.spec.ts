import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaModule } from '../../prisma/prisma.module';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminModule } from '../admin.module';
import { SetMemberActiveUseCase } from './set-member-active.use-case';

describe('SetMemberActiveUseCase', () => {
  let useCase: SetMemberActiveUseCase;
  let prisma: PrismaService;
  let memberUserId: string;
  let adminUserId: string;
  const memberEmail = `setactive-member-${Date.now()}@test.com`;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule, AdminModule],
    }).compile();

    useCase = module.get(SetMemberActiveUseCase);
    prisma = module.get(PrismaService);

    const memberRole = await prisma.role.findUnique({ where: { slug: 'member' } });
    if (!memberRole) throw new Error('Rôle member manquant');
    const admin = await prisma.user.findFirst({ where: { email: 'admin@test.com' }, select: { id: true } });
    if (!admin) throw new Error('Admin seed manquant');
    adminUserId = admin.id;

    const memberUser = await prisma.user.create({
      data: {
        firstname: 'Member',
        lastname: 'User',
        email: memberEmail,
        password: 'hash',
        isActive: true,
        emailVerifiedAt: new Date(),
        approvedAt: new Date(),
        approvedById: admin.id,
        roleId: memberRole.id,
      },
    });
    memberUserId = memberUser.id;
  });

  afterEach(async () => {
    await prisma.user.deleteMany({
      where: { email: memberEmail },
    });
  });

  it('met à jour le statut à inactif', async () => {
    const result = await useCase.run(memberUserId, false);
    expect(result.isActive).toBe(false);

    const user = await prisma.user.findUnique({ where: { id: memberUserId } });
    expect(user?.isActive).toBe(false);
  });

  it('met à jour le statut à actif', async () => {
    await prisma.user.update({
      where: { id: memberUserId },
      data: { isActive: false },
    });
    const result = await useCase.run(memberUserId, true);
    expect(result.isActive).toBe(true);

    const user = await prisma.user.findUnique({ where: { id: memberUserId } });
    expect(user?.isActive).toBe(true);
  });

  it('lance NotFoundException si userId inexistant', async () => {
    await expect(useCase.run('unknown-id', true)).rejects.toThrow(NotFoundException);
  });

  it('lance ForbiddenException si user n\'est pas member (ex. admin)', async () => {
    await expect(useCase.run(adminUserId, false)).rejects.toThrow(ForbiddenException);
  });
});
