-- CreateIndex
CREATE INDEX "games_status_idx" ON "games"("status");

-- CreateIndex
CREATE INDEX "games_player1_id_idx" ON "games"("player1_id");

-- CreateIndex
CREATE INDEX "games_player2_id_idx" ON "games"("player2_id");

-- CreateIndex
CREATE INDEX "games_finished_at_idx" ON "games"("finished_at");
