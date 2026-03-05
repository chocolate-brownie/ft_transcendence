import { checkGameOver } from "../services/games.service";
import { Board } from "../types/game";

export function evaluate(board: Board, aiSymbol: 'X' | 'O'): number
{
    const opponentSymbol = aiSymbol === 'X' ? 'O' : 'X';

    const winResult = checkGameOver(board);
    if (winResult.winner === aiSymbol) {
        return 10;
    } else if (winResult.winner === opponentSymbol) {
        return -10;
    }
    return 0; // No winner, could be a draw or game still in progress
}
