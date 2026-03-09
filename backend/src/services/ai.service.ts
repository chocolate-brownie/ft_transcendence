import { GameStatus, GameType, Difficulty } from "@prisma/client";
import { getAIMove } from "../ai/difficulty";
import prisma  from "../lib/prisma";
import { checkGameOver } from "../services/games.service";
import { Board, CellValue, Player } from "../types/game";

export const createAIGame = async (userId: number, difficulty: Difficulty, playerSymbol: Player) => {
  const aiSymbol = playerSymbol === 'X' ? 'O' : 'X';
  const board = Array(9).fill(null);
  if (aiSymbol === 'O') {
    const aiMove = getAIMove(board, aiSymbol, difficulty);
    board[aiMove] = aiSymbol;
  }

  const game = await prisma.game.create({
    data: {
      boardState: JSON.stringify(board),
      player1Id: userId,
      player2Id: null,
      player1Symbol: playerSymbol,
      player2Symbol:aiSymbol,
      currentTurn: playerSymbol === 'X' ? 'X' : 'O',
      status: GameStatus.IN_PROGRESS,
      gameType: GameType.AI,
      difficulty: difficulty.toUpperCase() as Difficulty,
    },
  });
  return Promise.resolve({ game, difficulty });
}

export const makeAIMove = async (gameId: number, userId: number, moveIndex: number) => {
  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game) {
    throw new Error('Game not found');
  }
  if (game.status !== GameStatus.IN_PROGRESS) {
    throw new Error('Game is not in progress');
  }
  if (game.player1Id !== userId) {
    throw new Error('Not your game');
  }

  const board = game.boardState as Board;
  const playerSymbol = game.player1Symbol;
  const aiSymbol = game.player2Symbol;

  if (game.currentTurn !== playerSymbol) {
    throw new Error('Not your turn');
  }

  if (board[moveIndex] !== null) {
    throw new Error('Cell is already occupied');
  }

  board[moveIndex] = playerSymbol as CellValue;

  const winner = checkGameOver(board, 3);
  if (winner) {
    await prisma.game.update({
      where: { id: gameId },
      data: {
        boardState: JSON.stringify(board),
        status: GameStatus.FINISHED,
        winnerId: userId,
        finishedAt: new Date().toISOString(),
      },
    });
    return {
      game: {
        boardState: board,
        status: GameStatus.FINISHED,
        winner: winner.isDraw ? null : playerSymbol,
      },
      aiMove: null,
    };
  }

  const aiMove = getAIMove(board, aiSymbol as Player, game.difficulty);
  board[aiMove] = aiSymbol as CellValue;

  const aiWinner = checkGameOver(board, 3);
  if (aiWinner) {
    await prisma.game.update({
      where: { id: gameId },
      data: {
        boardState: JSON.stringify(board),
        status: GameStatus.FINISHED,
        winnerId: null,
        finishedAt: new Date().toISOString(),
      },
    });
    return {
      game: {
        boardState: board,
        status: GameStatus.FINISHED,
        winner: aiWinner.isDraw ? null : aiSymbol,
      },
      aiMove: {
        moveIndex: aiMove,
        symbol: aiSymbol,
      }
    };
  }

  await prisma.game.update({
    where: { id: gameId },
    data: {
      boardState: JSON.stringify(board),
      currentTurn: playerSymbol,
    },
  });

  return {
    game: {
      boardState: board,
      status: GameStatus.IN_PROGRESS,
      winner: null,
    },
    aiMove: {
      moveIndex: aiMove,
      symbol: aiSymbol,
    }
  };
}
