import { Test, TestingModule } from '@nestjs/testing';
import { PrismaModule } from '../../prisma/prisma.module';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../../notification/infrastructure/email.service';
import { AuthModule } from '../auth.module';
import { RequestPasswordResetUseCase } from './request-password-reset.use-case';

describe('RequestPasswordResetUseCase', () => {
  let useCase: RequestPasswordResetUseCase;
  let prisma: PrismaService;
  let emailService: EmailService;
  let existingEmail: string;

  beforeEach(async () => {
    const mockEmailService = {
      sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule, AuthModule],
    })
      .overrideProvider(EmailService)
      .useValue(mockEmailService)
      .compile();

    useCase = module.get(RequestPasswordResetUseCase);
    prisma = module.get(PrismaService);
    emailService = module.get(EmailService);

    const memberRole = await prisma.role.findUnique({ where: { slug: 'member' } });
    if (!memberRole) throw new Error('Rôle member manquant pour les tests');

    existingEmail = `reset-${Date.now()}@test.com`;
    await prisma.user.create({
      data: {
        firstname: 'Reset',
        lastname: 'User',
        email: existingEmail,
        password: 'hash',
        isActive: true,
        roleId: memberRole.id,
      },
    });
  });

  afterEach(async () => {
    await prisma.userToken.deleteMany({
      where: { user: { email: { startsWith: 'reset-' } } },
    });
    await prisma.user.deleteMany({
      where: { email: { startsWith: 'reset-' } },
    });
  });

  it("crée un token de reset pour un utilisateur existant et renvoie un message générique", async () => {
    const result = await useCase.run({ email: existingEmail });
    expect(result.message).toContain('un lien de réinitialisation');

    const tokens = await prisma.userToken.findMany({
      where: { user: { email: existingEmail } },
    });
    expect(tokens.some((t) => t.type === 'PASSWORD_RESET')).toBe(true);

    expect(emailService.sendPasswordResetEmail).toHaveBeenCalledTimes(1);
    expect(emailService.sendPasswordResetEmail).toHaveBeenCalledWith(
      existingEmail,
      expect.any(String),
    );
    const tokenArg = (emailService.sendPasswordResetEmail as jest.Mock).mock.calls[0][1];
    expect(tokens.some((t) => t.token === tokenArg)).toBe(true);
  });

  it("renvoie un message générique même si l'utilisateur n'existe pas", async () => {
    const result = await useCase.run({ email: 'unknown@test.com' });
    expect(result.message).toContain('un lien de réinitialisation');
  });
});

