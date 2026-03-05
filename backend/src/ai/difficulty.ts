import { Board, DifficultyLevel, Player } from "../types/game";
import { minimax } from "./minimax";

export function getAIMove(board: Board, aiSymbol: Player, difficulty: DifficultyLevel): number
{
    let threshold = 1; // Par défaut 'hard' (100%)

    if (difficulty === 'easy') threshold = 0.5;
    if (difficulty === 'medium') threshold = 0.8;

    // Si on dépasse le seuil, on joue au hasard, sinon on joue le meilleur coup
    if (Math.random() > threshold) {
        const emptyCells = board.map((cell, index) => cell === null ? index : null)
                                .filter(index => index !== null);
        return emptyCells[Math.floor(Math.random() * emptyCells.length)];
    }

    return findBestMove(board, aiSymbol);
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
