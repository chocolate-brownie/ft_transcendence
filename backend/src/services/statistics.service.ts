
export interface GameOverStatsPayload {
  gameId: number;
  winnerId: number | null;
  loserId: number | null;
  isDraw: boolean;
  boardSize: number;
  totalMoves: number;
  durationSeconds: number;
  finishedAt: Date;
}

export async function updateGameStatistics(
  payload: GameOverStatsPayload,
): Promise<void> {
  console.log(
    `[Stats Placeholder] Game ${payload.gameId} ended — stats update not yet implemented`,
  );
}
