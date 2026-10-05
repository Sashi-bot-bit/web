/*
  Warnings:

  - You are about to drop the column `guestTokenExpiresAt` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `guestTokenHash` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `guestTokenHash` on the `SupportTicket` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Order_guestTokenHash_key";

-- DropIndex
DROP INDEX "SupportTicket_guestTokenHash_key";

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "guestTokenExpiresAt",
DROP COLUMN "guestTokenHash";

-- AlterTable
ALTER TABLE "SupportTicket" DROP COLUMN "guestTokenHash";
