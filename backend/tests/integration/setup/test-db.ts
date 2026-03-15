import { PrismaClient } from '@prisma/client';

/**
 * Supprime les users et tokens créés par les tests d'intégration.
 * Préserve les données du seed (admin@test.com, member@test.com).
 */
export async function cleanupAuthData(prisma: PrismaClient): Promise<void> {
  const testUsers = await prisma.user.findMany({
    where: {
      OR: [
        { email: { startsWith: 'it-' } },
        { email: { startsWith: 'new-user-' } },
      ],
    },
    select: { id: true },
  });
  const testUserIds = testUsers.map((u) => u.id);

  if (testUserIds.length > 0) {
    await prisma.userToken.deleteMany({
      where: { userId: { in: testUserIds } },
    });
  }

  await prisma.user.deleteMany({
    where: {
      OR: [
        { email: { startsWith: 'it-' } },
        { email: { startsWith: 'new-user-' } },
      ],
    },
  });
}

/**
 * Supprime les espaces et équipements créés par les tests d'intégration admin.
 * Préserve les données du seed.
 */
export async function cleanupAdminData(prisma: PrismaClient): Promise<void> {
  await prisma.space.deleteMany({
    where: { code: { startsWith: 'IT-' } },
  });

  await prisma.equipement.deleteMany({
    where: { name: { startsWith: 'it-' } },
  });
}

/**
 * Soft delete des réservations créées par les tests :
 * - title commence par "it-"
 * - ou title = "Réunion modifiée" / "Test" (titres utilisés dans les tests PATCH).
 * Ainsi les données de test ne polluent pas la base.
 */
export async function cleanupReservationData(prisma: PrismaClient): Promise<void> {
  await prisma.reservation.updateMany({
    where: {
      OR: [
        { title: { startsWith: 'it-' } },
        { title: 'Réunion modifiée' },
        { title: 'Test' },
      ],
    },
    data: { deletedAt: new Date() },
  });
}

/**
 * Soft delete des réservations d'un utilisateur qui chevauchent [rangeStart, rangeEnd].
 * Utile pour garantir des créneaux libres avant un test (résilience aux données résiduelles).
 */
export async function cleanupReservationsForUserInRange(
  prisma: PrismaClient,
  userId: string,
  rangeStart: Date,
  rangeEnd: Date,
): Promise<void> {
  await prisma.reservation.updateMany({
    where: {
      userId,
      deletedAt: null,
      startDatetime: { lt: rangeEnd },
      endDatetime: { gt: rangeStart },
    },
    data: { deletedAt: new Date() },
  });
}
