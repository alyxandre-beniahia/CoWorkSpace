/*
  Warnings:

  - You are about to drop the `ReservationActivityLog` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ReservationActivityLog" DROP CONSTRAINT "ReservationActivityLog_userId_fkey";

-- DropTable
DROP TABLE "ReservationActivityLog";
