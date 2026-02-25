-- AlterEnum
ALTER TYPE "GameStatus" ADD VALUE 'ABANDONED';

-- AlterTable
ALTER TABLE "games" ADD COLUMN     "player1_symbol" TEXT NOT NULL DEFAULT 'X',
ADD COLUMN     "player2_symbol" TEXT NOT NULL DEFAULT 'O',
ADD COLUMN     "started_at" TIMESTAMP(3);
