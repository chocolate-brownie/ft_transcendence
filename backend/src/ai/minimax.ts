import { Board, Player } from "../types/game";
import { evaluate } from "./evaluation";


export function minimax(board: Board, depth: number, alpha: number = -Infinity, beta: number = Infinity, isMaximizing: boolean, aiSymbol: Player): number
{
    if (board === null) {
        return -1; // Invalid board state
    }
    const opponentSymbol = aiSymbol === "X" ? "O" : "X";

    const score = evaluate(board, aiSymbol);

    if (score === 10)
        return score - depth; // Favorise quicker wins
    if (score === -10)
        return score + depth; // Favorise slower losses
    if (!board.includes(null))
        return 0; // Draw

    if (isMaximizing) {
        let bestScore = -Infinity;
        for (let i = 0; i < 9; i++) {
          if (board[i] === null) {
            board[i] = aiSymbol;
            const currentScore = minimax(board, depth + 1, alpha, beta, false, aiSymbol);
            board[i] = null;
            bestScore = Math.max(bestScore, currentScore);
            alpha = Math.max(alpha, bestScore);
            if (beta <= alpha) { break; } // looking for least => if node score is greater than beta, no need to explore further
          }
        }
      return bestScore;
    } else {
        let bestScore = Infinity;
        for (let i = 0; i < 9; i++) {
          if (board[i] === null) {
            board[i] = opponentSymbol;
            const currentScore = minimax(board, depth + 1, alpha, beta, true, aiSymbol);
            board[i] = null;
            bestScore = Math.min(bestScore, currentScore);
            beta = Math.min(beta, bestScore);
            if (beta <= alpha) { break; } // looking for greatest => if node score is less than alpha, no need to explore further
          }
        }
      return bestScore;
    }
}
