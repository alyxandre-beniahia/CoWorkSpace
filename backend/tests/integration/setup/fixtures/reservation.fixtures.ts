import { PrismaClient } from '@prisma/client';

export type CreateTestReservationOverrides = {
  userId?: string;
  spaceId?: string;
  startDatetime?: Date;
  endDatetime?: Date;
  title?: string | null;
  isPrivate?: boolean;
};

/**
 * Crée une réservation de test.
 * Par défaut title: "it-{timestamp}" pour le cleanup (soft delete).
 */
export async function createTestReservation(
  prisma: PrismaClient,
  overrides: CreateTestReservationOverrides = {},
): Promise<{ reservation: { id: string; title: string | null } }> {
  const now = new Date();
  const start = overrides.startDatetime ?? new Date(now.getTime() + 24 * 60 * 60 * 1000); // +24h
  const end = overrides.endDatetime ?? new Date(start.getTime() + 60 * 60 * 1000); // +1h

  const title = overrides.title ?? `it-${Date.now()}`;

  if (!overrides.userId || !overrides.spaceId) {
    throw new Error('createTestReservation requires userId and spaceId');
  }

  const reservation = await prisma.reservation.create({
    data: {
      userId: overrides.userId,
      spaceId: overrides.spaceId,
      startDatetime: start,
      endDatetime: end,
      title,
      isPrivate: overrides.isPrivate ?? false,
    },
    select: { id: true, title: true },
  });

  return { reservation };
}
