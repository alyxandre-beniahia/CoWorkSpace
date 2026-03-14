-- CreateTable
CREATE TABLE "Seat" (
    "id" TEXT NOT NULL,
    "spaceId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "positionX" DOUBLE PRECISION,
    "positionY" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Seat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Seat_spaceId_code_key" ON "Seat"("spaceId", "code");

-- CreateIndex
CREATE INDEX "Seat_spaceId_idx" ON "Seat"("spaceId");

-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN "seatId" TEXT;

-- CreateIndex
CREATE INDEX "Reservation_seatId_startDatetime_endDatetime_idx" ON "Reservation"("seatId", "startDatetime", "endDatetime");

-- AddForeignKey
ALTER TABLE "Seat" ADD CONSTRAINT "Seat_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_seatId_fkey" FOREIGN KEY ("seatId") REFERENCES "Seat"("id") ON DELETE SET NULL ON UPDATE CASCADE;
