-- CreateTable
CREATE TABLE "ReservationActivityLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reservationId" TEXT,
    "spaceName" TEXT,
    "reservationStart" TIMESTAMP(3),
    "reservationEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReservationActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReservationActivityLog_createdAt_idx" ON "ReservationActivityLog"("createdAt");

-- AddForeignKey
ALTER TABLE "ReservationActivityLog" ADD CONSTRAINT "ReservationActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
