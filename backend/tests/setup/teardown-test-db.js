/**
 * En fin d'exécution des tests d'intégration/fonctionnels, supprime toutes
 * les données créées (seed + données des tests) pour ne pas polluer la base.
 */
const path = require('path');
const fs = require('fs');

const backendRoot = path.resolve(__dirname, '../..');

function loadEnvTest() {
  const envTestPath = path.join(backendRoot, '.env.test');
  if (fs.existsSync(envTestPath)) {
    const content = fs.readFileSync(envTestPath, 'utf8');
    content.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const eq = trimmed.indexOf('=');
        if (eq > 0) {
          const key = trimmed.slice(0, eq).trim();
          if (key === 'DATABASE_URL' && process.env.DATABASE_URL) return;
          let value = trimmed.slice(eq + 1).trim();
          if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          process.env[key] = value;
        }
      }
    });
  }
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = 'postgresql://cowork:cowork_dev@localhost:5433/coworkspace_test';
  }
}

module.exports = async function globalTeardown() {
  loadEnvTest();
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  try {
    await prisma.notificationLog.deleteMany();
    await prisma.reservation.deleteMany();
    await prisma.userToken.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.updateMany({ data: { approvedById: null } });
    await prisma.user.deleteMany();
    await prisma.seat.deleteMany();
    await prisma.spaceEquipement.deleteMany();
    await prisma.space.deleteMany();
    await prisma.equipement.deleteMany();
    await prisma.role.deleteMany();
  } finally {
    await prisma.$disconnect();
  }
};
