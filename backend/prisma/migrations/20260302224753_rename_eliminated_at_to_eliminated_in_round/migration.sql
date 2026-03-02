/*
  Warnings:

  - You are about to drop the column `eliminated_at` on the `tournament_participants` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "tournament_participants" DROP COLUMN "eliminated_at",
ADD COLUMN     "eliminated_in_round" INTEGER;
