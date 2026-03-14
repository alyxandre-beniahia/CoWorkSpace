import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminRole = await prisma.role.upsert({
    where: { slug: 'admin' },
    update: {},
    create: { id: 'role-admin', name: 'Administrateur', slug: 'admin' },
  });
  const memberRole = await prisma.role.upsert({
    where: { slug: 'member' },
    update: {},
    create: { id: 'role-member', name: 'Membre', slug: 'member' },
  });

  const hashedPassword = await bcrypt.hash('password123', 10);

  await prisma.user.upsert({
    where: { email: 'admin@test.com' },
    update: {},
    create: {
      firstname: 'Admin',
      lastname: 'Test',
      email: 'admin@test.com',
      password: hashedPassword,
      isActive: true,
      roleId: adminRole.id,
      approvedAt: new Date(),
    },
  });
  await prisma.user.upsert({
    where: { email: 'member@test.com' },
    update: {},
    create: {
      firstname: 'Member',
      lastname: 'Test',
      email: 'member@test.com',
      password: hashedPassword,
      isActive: true,
      roleId: memberRole.id,
      approvedAt: new Date(),
    },
  });

  // Espaces : 1 open space (50 postes) + 4 salles de réunion
  const spaces = [
    {
      code: 'OPEN-SPACE',
      name: 'Open space principal',
      type: 'OPEN_SPACE' as const,
      capacity: 50,
      description: 'Grand open space avec 50 postes en libre-service.',
      positionX: 120,
      positionY: 120,
    },
    {
      code: 'SR-A',
      name: 'Salle Réunion A',
      type: 'MEETING_ROOM' as const,
      capacity: 6,
      description: 'Salle de réunion pour 6 personnes.',
      positionX: 480,
      positionY: 60,
    },
    {
      code: 'SR-B',
      name: 'Salle Réunion B',
      type: 'MEETING_ROOM' as const,
      capacity: 8,
      description: 'Salle de réunion pour 8 personnes.',
      positionX: 480,
      positionY: 160,
    },
    {
      code: 'SR-C',
      name: 'Salle Réunion C',
      type: 'MEETING_ROOM' as const,
      capacity: 10,
      description: 'Salle de réunion pour 10 personnes.',
      positionX: 480,
      positionY: 260,
    },
    {
      code: 'SR-D',
      name: 'Salle Réunion D',
      type: 'MEETING_ROOM' as const,
      capacity: 12,
      description: 'Grande salle de réunion pour 12 personnes.',
      positionX: 480,
      positionY: 360,
    },
  ];

  for (const space of spaces) {
    await prisma.space.upsert({
      where: { code: space.code },
      update: {
        name: space.name,
        type: space.type,
        capacity: space.capacity,
        description: space.description,
        positionX: space.positionX,
        positionY: space.positionY,
      },
      create: {
        name: space.name,
        code: space.code,
        type: space.type,
        capacity: space.capacity,
        description: space.description,
        positionX: space.positionX,
        positionY: space.positionY,
      },
    });
  }

  // Postes pour l'openspace (50 postes OS-01 à OS-50)
  const openSpace = await prisma.space.findUnique({ where: { code: 'OPEN-SPACE' } });
  if (openSpace) {
    for (let i = 1; i <= 50; i++) {
      const code = `OS-${String(i).padStart(2, '0')}`;
      await prisma.seat.upsert({
        where: {
          spaceId_code: { spaceId: openSpace.id, code },
        },
        update: {},
        create: {
          spaceId: openSpace.id,
          code,
        },
      });
    }
  }

  console.log('Seed OK: rôles admin/member et utilisateurs admin@test.com / member@test.com (mdp: password123)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
