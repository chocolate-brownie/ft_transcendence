import { GameStatus, GameType, Difficulty } from "@prisma/client";
import { getAIMove } from "../ai/difficulty";
import prisma  from "../lib/prisma";
import { checkGameOver } from "../services/games.service";
import { Board, CellValue, Player } from "../types/game";

export const createAIGame = async (userId: number, difficulty: Difficulty, playerSymbol: Player) => {
  const aiSymbol = playerSymbol === 'X' ? 'O' : 'X';
  const board = Array(9).fill(null);
  if (aiSymbol === 'X') {
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
      currentTurn: playerSymbol,
      status: GameStatus.IN_PROGRESS,
      gameType: GameType.AI,
      difficulty: difficulty.toUpperCase() as Difficulty,
    },
  });
  return { game, difficulty };
}

const finishGame = async (gameId: number, board: Board, winnerId: number | null, isDraw: boolean) => {
  return await prisma.game.update({
    where: { id: gameId },
    data: {
      boardState: JSON.stringify(board),
      status: isDraw ? GameStatus.DRAW : GameStatus.FINISHED,
      winnerId: winnerId,
      finishedAt: new Date(),
    },
  });
};

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

  const board = JSON.parse(game.boardState as string) as Board;
  const playerSymbol = game.player1Symbol;
  const aiSymbol = game.player2Symbol;

  if (game.currentTurn !== playerSymbol) {
    throw new Error('Not your turn');
  }

  if (board[moveIndex] !== null) {
    throw new Error('Cell is already occupied');
  }

  board[moveIndex] = playerSymbol as CellValue;

  const playerWin = checkGameOver(board, 3);
  if (playerWin.gameOver) {
    const finishedGame = await finishGame(gameId, board, playerWin.isDraw ? null : userId, playerWin.isDraw);
    return {
      game: {
        boardState: board,
        status: finishedGame.status,
        winner: playerWin.isDraw ? null : playerSymbol,
      },
      aiMove: null,
    };
  }

  const aiMove = getAIMove(board, aiSymbol as Player, game.difficulty as Difficulty);
  board[aiMove] = aiSymbol as CellValue;

  const aiWin = checkGameOver(board, 3);
  if (aiWin.gameOver) {
    const finishedGame = await finishGame(gameId, board, null, aiWin.isDraw); // It's either a draw or the AI wins, so winnerId is null
    return {
      game: {
        boardState: board,
        status: finishedGame.status,
        winner: aiWin.isDraw ? null : aiSymbol,
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


export const getAIGameById = async (gameId: number, userId: number) => {
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: {
      player1: {
        select: {
          id: true,
          username: true,
          avatarUrl: true,
        }
      }
    }
  });
  if (!game) {
    throw new Error('Game not found');
  }
  if (game.player1Id !== userId) {
    throw new Error('Not your game');
  }
  return game;
}
