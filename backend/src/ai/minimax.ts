import { Board, DifficultyLevel, Player } from "../types/game";
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

export function getAIMove(board: Board, aiSymbol: Player, difficulty: DifficultyLevel): number
{
    if (difficulty === 'easy') {
      // 50% de chances de jouer au hasard
      if (Math.random() < 0.5) {
          return findBestMove(board, aiSymbol);
      }
    }
    if (difficulty === 'medium') {
          if (Math.random() < 0.2) {  // 20% de chances de jouer au hasard
              return findBestMove(board, aiSymbol);
          }
      }

    else if (difficulty === 'hard') {
        return findBestMove(board, aiSymbol);
    }

      // Par défaut, retourne un coup aléatoire
    const emptyCells = board.map((cell, index) => cell === null ? index : null).filter(index => index !== null) as number[];
    return emptyCells[Math.floor(Math.random() * emptyCells.length)];
}


export function findBestMove(board: Board, aiSymbol: Player): number
{
    let bestScore = -Infinity;
    let bestMove = -1;

    if (board.every(cell => cell === null)) {
        return 4; // Prend le centre si c'est le premier coup
    }

    for (let i = 0; i < 9; i++) {
        if (board[i] === null) {
            board[i] = aiSymbol;
            const score = minimax(board, 0, -Infinity, Infinity, false, aiSymbol);
            board[i] = null;

            if (score > bestScore) {
                bestMove = i;
                bestScore = score;
            }
        }
    }
    return bestMove;
}
