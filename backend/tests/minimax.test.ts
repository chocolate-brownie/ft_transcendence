import { describe, test, expect } from "@jest/globals";
import { getAIMove } from '../src/ai/minimax';
import { evaluate } from "../src/ai/evaluation";
import { Board, CellValue, Player } from '../src/types/game';
import { checkGameOver } from "../src/services/games.service";

// Helper pour créer un plateau rapidement
const createBoard = (cells: string): Board => {
    return cells.split('').map(c => c === '.' ? null : c) as Board;
};

describe('Minimax Algorithm', () => {
    let ai: 'X' | 'O' = 'O'; // L'IA joue avec 'O'

    test('doit jouer au hasard OU empecher la victoire de l\'adversaire (7)', () => {
      ai = 'O'; // L'IA joue avec 'O'
      const board = createBoard(
          'XO.' +
          '.O.' +
          '...'
      );
      const bestMove = getAIMove(board, ai, 'easy');
      console.log('Random move :', bestMove);
      expect(bestMove).toBeGreaterThan(0);
    });
    test('doit détecter une victoire immédiate pour l\'IA', () => {
        // X est sur le point de gagner sur la première ligne
        ai = 'O'; // L'IA joue avec 'O'
        const board = createBoard(
            'XXO' +
            'OO.' +
            'X..'
        );
        const bestMove = getAIMove(board, ai, 'hard');
        console.log('Meilleure case pour la victoire immédiate :', bestMove);
        expect(bestMove).toBe(5);
    });

    test('doit renvoyer 0 first move', () => {
      ai = 'X'; // L'IA joue avec 'X'
        const board = createBoard(
            '...' +
            '...' +
            '...'
        );
        const start = Date.now();
        const bestMove = getAIMove(board, ai, 'hard');
        const duration = Date.now() - start;
        console.log('Best move for empty board (should be 4):', bestMove, 'Time taken:', duration, 'ms');
        expect(bestMove).toBe(4);
    });

    test('IA doit privilégier la victoire la plus rapide', () => {
        // Situation : X peut gagner en 1 coup (index 2)
        // ou en 3 coups ailleurs. Le score avec depth 0 doit être plus élevé
        // que si on simulait un coup plus loin.
        ai = 'X'; // L'IA joue avec 'X'
        const board1 = createBoard(
            'XOX' +
            'OX.' +
            '..O'
        );
        const start = Date.now();
        const bestMove1 = getAIMove(board1, ai, 'hard');
        const duration = Date.now() - start;
        console.log('Best move for winning immediately :', bestMove1, 'Time taken:', duration, 'ms');

        expect(bestMove1).toBe(6); // Gagner immédiatement
    });
    test('doit retoruner la cell 8 Ou Fail (MEDIUM DIFFICULTY)', () => {
        // X est sur le point de gagner sur la première ligne
        ai = 'X'; // L'IA joue avec 'X'
        const board = createBoard(
            'X.X' +
            'OOX' +
            '...'
        );
        const start = Date.now();
        const bestMove = getAIMove(board, ai, 'medium');
        const duration = Date.now() - start;
        console.log('Best move for medium difficulty :', bestMove, 'Time taken:', duration, 'ms');
        expect(bestMove).toBeGreaterThanOrEqual(1);
    });

    test('IA VS IA (DRAW)', () => {
        ai = 'X'; // L'IA joue avec 'X'
        let board = createBoard(
            '...' +
            '...' +
            '...'
        );
        let turn: Player = 'X';

        while (!checkGameOver(board).gameOver && !board.every(cell => cell !== null)) {
          const move = getAIMove(board, turn, 'hard');
          board[move] = turn as CellValue;
          turn = turn === 'X' ? 'O' : 'X';
        }

        expect(checkGameOver(board).winner).toBeNull(); // No winner
        expect(checkGameOver(board).isDraw).toBe(true); // Draw
    });

    test('Evaluate function should return correct scores', () => {
      ai = 'X'; // L'IA joue avec 'X'
        const boardWinX = createBoard(
            'XXX' +
            'OO.' +
            '...'
        );
        const boardWinO = createBoard(
            'XOX' +
            'OOO' +
            'X..'
        );
        const boardDraw = createBoard(
            'XOX' +
            'OXO' +
            'OXO'
        );
        const boardInProgress = createBoard(
            'XOX' +
            'O.X' +
            '...'
        );

        expect(evaluate(boardWinX, 'X')).toBe(10);
        expect(evaluate(boardWinX, 'O')).toBe(-10);
        expect(evaluate(boardWinO, 'O')).toBe(10);
        expect(evaluate(boardWinO, 'X')).toBe(-10);
        expect(evaluate(boardDraw, 'X')).toBe(0);
        expect(evaluate(boardDraw, 'O')).toBe(0);
        expect(evaluate(boardInProgress, 'X')).toBe(0);
        expect(evaluate(boardInProgress, 'O')).toBe(0);
    }
    );
});
