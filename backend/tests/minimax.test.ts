import { describe, test, expect } from "@jest/globals";
import { minimax, findBestMove, getAIMove } from '../src/ai/minimax';
import { Board } from '../src/types/game';

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
        const bestMove = getAIMove(board, ai, 'hard');
        console.log('Best move for empty board (should be 4):', bestMove);
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
        const bestMove1 = getAIMove(board1, ai, 'hard');

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
        const bestMove = getAIMove(board, ai, 'medium');
        console.log('Meilleure case pour la victoire immédiate :', bestMove);
        expect(bestMove).toBe(1);
    });
});
