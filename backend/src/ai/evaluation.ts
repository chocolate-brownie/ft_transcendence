import { checkGameOver, checkWinnerWithLine } from "../services/games.service";
import { Board } from "../types/game";

export function evaluate(board: Board, aiSymbol: 'X' | 'O'): number
{
    const opponentSymbol = aiSymbol === 'X' ? 'O' : 'X';

    const winResult = checkWinnerWithLine(board);
    if (winResult) {
      return winResult.winner === aiSymbol ? 10 : -10;
    }
    return 0; // No winner, could be a draw or game still in progress
}
