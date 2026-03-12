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
