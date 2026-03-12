/*
  Warnings:

  - The `status` column on the `Space` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[code]` on the table `Space` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `NotificationLog` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `type` on the `NotificationLog` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `type` on the `Space` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `type` on the `UserToken` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "SpaceType" AS ENUM ('MEETING_ROOM', 'HOT_DESK', 'OPEN_SPACE');

-- CreateEnum
CREATE TYPE "SpaceStatus" AS ENUM ('AVAILABLE', 'MAINTENANCE', 'OCCUPIED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('SIGNUP_CONFIRMATION', 'RESERVATION_CONFIRMATION', 'RESERVATION_REMINDER_24H', 'RESERVATION_CANCELLED');

-- CreateEnum
CREATE TYPE "TokenType" AS ENUM ('PASSWORD_RESET', 'EMAIL_VERIFICATION');

-- AlterTable
ALTER TABLE "NotificationLog" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "type",
ADD COLUMN     "type" "NotificationType" NOT NULL;

-- AlterTable
ALTER TABLE "Space" ADD COLUMN     "code" TEXT,
ADD COLUMN     "description" TEXT,
DROP COLUMN "type",
ADD COLUMN     "type" "SpaceType" NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "SpaceStatus" NOT NULL DEFAULT 'AVAILABLE';

-- AlterTable
ALTER TABLE "UserToken" DROP COLUMN "type",
ADD COLUMN     "type" "TokenType" NOT NULL;

-- CreateIndex
CREATE INDEX "Equipement_name_idx" ON "Equipement"("name");

-- CreateIndex
CREATE INDEX "NotificationLog_userId_type_idx" ON "NotificationLog"("userId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "Space_code_key" ON "Space"("code");

-- CreateIndex
CREATE INDEX "Space_name_idx" ON "Space"("name");
