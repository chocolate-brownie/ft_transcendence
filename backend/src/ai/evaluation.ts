import { checkWinnerWithLine } from "../services/games.service";
import { Board, CellValue } from "../types/game";

export function evaluate(board: CellValue[], aiSymbol: 'X' | 'O'): number
{
    const winResult = checkWinnerWithLine(board as Board);
    if (winResult) {
      return winResult.winner === aiSymbol ? 10 : -10;
    }
    return 0; // No winner, could be a draw or game still in progress
}
