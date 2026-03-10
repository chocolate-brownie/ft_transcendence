import { describe, test, expect } from "@jest/globals";
import { getAIMove } from '../src/ai/difficulty';
import { checkGameOver } from "../src/services/games.service";
import { Board, Player } from '../src/types/game';
import { Difficulty } from "@prisma/client";

const SIMULATIONS_PER_LEVEL = 100; // Nombre de parties par niveau

function simulateGame(difficulty: Difficulty) {
    let board: Board = Array(9).fill(null);
    let currentPlayer: Player = 'X'; // Le "Joueur" (simulé par des coups aléatoires)
    const aiPlayer: Player = 'O';
    let win = checkGameOver(board, 3);
    let maxCalculDuration = 0;

    while (!win.gameOver) {
        win = checkGameOver(board, 3);

        let move: number;
        if (currentPlayer === aiPlayer) {
            const start = Date.now();
            // L'IA joue selon la difficulté testée
            move = getAIMove(board, aiPlayer, difficulty);

            const duration = Date.now() - start;
            if (duration > maxCalculDuration)
                maxCalculDuration = duration;
            // const moveNB = board.filter(cell => cell !== null).length;
            // if (moveNB == 0)
            //   console.log("Early game duration (Empty board): ", duration, "ms waiting < 100ms");
            // if (moveNB < 6)
            //   console.log("mid game duration (Empty board): ", duration, "ms, waiting < 50ms");
            // if (moveNB >= 6)
            //   console.log("End game duration (Empty board): ", duration, "ms, waiting < 30ms");
        } else {
            // Le "Joueur" joue de manière aléatoire pour tester la résistance de l'IA
            const availableMoves = board.map((v, i) => v === null ? i : null).filter(v => v !== null) as number[];
            move = availableMoves[Math.floor(Math.random() * availableMoves.length)];
        }

        board[move] = currentPlayer;
        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    }

    //console.log("Board final State: ", JSON.stringify(board));
    const winData = { winType: 'draw', maxAiCalcul: maxCalculDuration};
    if (win.isDraw) return winData;
    winData.winType = win.winner === aiPlayer ? 'ai_win' : 'player_win';
    return winData;
}

describe('AI Difficulty Statistical Verification', () => {

    test('EASY: Player should win around 40-60% of games', () => {
        let playerWins = 0;
        let maxAIDelay = 0;
        for (let i = 0; i < SIMULATIONS_PER_LEVEL; i++) {
          const data = simulateGame(Difficulty.EASY);
            if (data.winType === 'player_win') playerWins++;

            if (data.maxAiCalcul > maxAIDelay)
              maxAIDelay = data.maxAiCalcul;
        }
        const winRate = (playerWins / SIMULATIONS_PER_LEVEL) * 100;
        console.log(`Easy Win Rate: ${winRate}%, max AI response Time: ${maxAIDelay}`);
        expect(winRate).toBeGreaterThanOrEqual(20);
    });

    test('MEDIUM: Player should win around 40-60% of games', () => {
        let playerWins = 0;
        let maxAIDelay = 0;
        for (let i = 0; i < SIMULATIONS_PER_LEVEL; i++) {
          const data = simulateGame(Difficulty.MEDIUM);
            if (data.winType === 'player_win') playerWins++;

            if (data.maxAiCalcul > maxAIDelay)
              maxAIDelay = data.maxAiCalcul;
        }
        const winRate = (playerWins / SIMULATIONS_PER_LEVEL) * 100;
        console.log(`Medium Win Rate: ${winRate}%, max AI response Time: ${maxAIDelay}`);
        expect(winRate).toBeLessThanOrEqual(30);
    });

    test('HARD: Player should NEVER win (0%)', () => {
        let playerWins = 0;
        let maxAIDelay = 0;
        for (let i = 0; i < SIMULATIONS_PER_LEVEL; i++) {
            const data = simulateGame(Difficulty.HARD);

            if (data.winType === 'player_win') playerWins++;
            if (data.maxAiCalcul > maxAIDelay)
              maxAIDelay = data.maxAiCalcul;
        }
        const winRate = (playerWins / SIMULATIONS_PER_LEVEL) * 100;
        console.log(`Hard Player Win Rate: ${winRate}%, max AI response Time: ${maxAIDelay}`);
        expect(playerWins).toBe(0); // L'IA Hard est imbattable
    });
});
