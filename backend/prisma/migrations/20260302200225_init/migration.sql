/*
  Warnings:

  - Made the column `seed` on table `tournament_participants` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `created_by_id` to the `tournaments` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "tournament_participants" ALTER COLUMN "seed" SET NOT NULL;

-- AlterTable
ALTER TABLE "tournaments" ADD COLUMN     "created_by_id" INTEGER NOT NULL,
ADD COLUMN     "current_round" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "winner_id" INTEGER;

-- CreateIndex
CREATE INDEX "tournaments_status_idx" ON "tournaments"("status");

-- CreateIndex
CREATE INDEX "tournaments_created_by_id_idx" ON "tournaments"("created_by_id");

-- CreateIndex
CREATE INDEX "tournaments_winner_id_idx" ON "tournaments"("winner_id");

-- AddForeignKey
ALTER TABLE "tournaments" ADD CONSTRAINT "tournaments_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournaments" ADD CONSTRAINT "tournaments_winner_id_fkey" FOREIGN KEY ("winner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
