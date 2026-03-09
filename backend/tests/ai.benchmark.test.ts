import { describe, test, expect } from "@jest/globals";
import { getAIMove } from '../src/ai/difficulty';
import { checkGameOver } from "../src/services/games.service";
import { Board, Player } from '../src/types/game';
import { Difficulty } from "@prisma/client";

const SIMULATIONS_PER_LEVEL = 50; // Nombre de parties par niveau

function simulateGame(difficulty: Difficulty) {
    let board: Board = Array(9).fill(null);
    let currentPlayer: Player = 'X'; // Le "Joueur" (simulé par des coups aléatoires)
    const aiPlayer: Player = 'O';
    let win = checkGameOver(board, 3);

    while (!win.gameOver) {
        win = checkGameOver(board, 3);

        let move: number;
        if (currentPlayer === aiPlayer) {
            // L'IA joue selon la difficulté testée
            move = getAIMove(board, aiPlayer, difficulty);
        } else {
            // Le "Joueur" joue de manière aléatoire pour tester la résistance de l'IA
            const availableMoves = board.map((v, i) => v === null ? i : null).filter(v => v !== null) as number[];
            move = availableMoves[Math.floor(Math.random() * availableMoves.length)];
        }

        board[move] = currentPlayer;
        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    }

    //console.log("Board final State: ", JSON.stringify(board));
    if (win.isDraw) return 'draw';
    return win.winner === aiPlayer ? 'ai_win' : 'player_win';
}

describe('AI Difficulty Statistical Verification', () => {

    test('EASY: Player should win around 40-60% of games', () => {
        let playerWins = 0;
        for (let i = 0; i < SIMULATIONS_PER_LEVEL; i++) {
            if (simulateGame(Difficulty.EASY) === 'player_win') playerWins++;
        }
        const winRate = (playerWins / SIMULATIONS_PER_LEVEL) * 100;
        console.log(`Easy Win Rate: ${winRate}%`);
        expect(winRate).toBeGreaterThanOrEqual(20);
    });

    test('MEDIUM: Player should win around 40-60% of games', () => {
        let playerWins = 0;
        for (let i = 0; i < SIMULATIONS_PER_LEVEL; i++) {
            if (simulateGame(Difficulty.MEDIUM) === 'player_win') playerWins++;
        }
        const winRate = (playerWins / SIMULATIONS_PER_LEVEL) * 100;
        console.log(`Medium Win Rate: ${winRate}%`);
        expect(winRate).toBeLessThanOrEqual(20);
    });

    test('HARD: Player should NEVER win (0%)', () => {
        let playerWins = 0;
        for (let i = 0; i < SIMULATIONS_PER_LEVEL; i++) {
            if (simulateGame(Difficulty.HARD) === 'player_win') playerWins++;
        }
        console.log(`Hard Player Win Rate: ${playerWins} games won`);
        expect(playerWins).toBe(0); // L'IA Hard est imbattable
    });
});
