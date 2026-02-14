/*
  Warnings:

  - You are about to drop the column `score_p1` on the `games` table. All the data in the column will be lost.
  - You are about to drop the column `score_p2` on the `games` table. All the data in the column will be lost.

*/
-- AlterEnum
ALTER TYPE "GameStatus" ADD VALUE 'DRAW';

-- AlterEnum
ALTER TYPE "GameType" ADD VALUE 'AI';

-- AlterTable
ALTER TABLE "games" DROP COLUMN "score_p1",
DROP COLUMN "score_p2",
ADD COLUMN     "board_size" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "board_state" JSONB NOT NULL DEFAULT '[null,null,null,null,null,null,null,null,null]',
ADD COLUMN     "current_turn" TEXT NOT NULL DEFAULT 'X',
ADD COLUMN     "settings" JSONB;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "display_name" TEXT,
ADD COLUMN     "draws" INTEGER NOT NULL DEFAULT 0;
