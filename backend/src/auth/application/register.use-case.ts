import { Injectable, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import type { RegisterDto } from '../dto/register.dto';
import { randomBytes } from 'crypto';

type RegisterResult = {
  message: string;
};

@Injectable()
export class RegisterUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async run(dto: RegisterDto): Promise<RegisterResult> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true },
    });
    if (existing) {
      throw new BadRequestException('Un compte existe déjà avec cet email');
    }

    const roleMember = await this.prisma.role.findUnique({
      where: { slug: 'member' },
      select: { id: true },
    });
    if (!roleMember) {
      throw new BadRequestException('Rôle member manquant en base');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const token = randomBytes(32).toString('hex');

    const user = await this.prisma.user.create({
      data: {
        firstname: dto.firstname,
        lastname: dto.lastname,
        email: dto.email,
        password: passwordHash,
        isActive: false,
        roleId: roleMember.id,
      },
    });

    await this.prisma.userToken.create({
      data: {
        type: 'EMAIL_VERIFICATION',
        token,
        userId: user.id,
      },
    });

    return {
      message: 'Inscription enregistrée. Vérifiez vos emails pour valider votre compte.',
    };
  }
}

