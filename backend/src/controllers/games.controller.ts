import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import {
  createGameInDb,
  CREATE_ERRORS,
  makeMoveInDb,
  validateCreateGame,
} from "../services/games.service";

// ── createGame ────────────────────────────────────────

export const createGame = async (req: AuthRequest, res: Response) => {
  try {
    const player1Id: number = req.user.id;
    const { player2Id } = req.body;

    if (player2Id != null) {

      if (player2Id === player1Id) {
        return res.status(400).json({ error: CREATE_ERRORS.SELF_PLAY });
      }

      // Check RelationShip
      const validation = await validateCreateGame(player1Id, player2Id);

      if (!validation.valid) {
        const status = validation.error === CREATE_ERRORS.NOT_FRIENDS ? 403 : 400;
        return res.status(status).json({ error: validation.error });
      }
    }

    // Create Game

    const game = await createGameInDb(player1Id, player2Id ?? undefined);

    return res.status(201).json(game);
  } catch (error) {
    console.error("Error creating game:", error);
    return res.status(500).json({ error: "Failed to create game" });
  }
};

// ── makeMove ──────────────────────────────────────────

export const makeMove = async (req: AuthRequest, res: Response) => {
  try {
    const gameId = parseInt(req.params.id as string);
    if (isNaN(gameId)) {
      return res.status(400).json({ error: 'Invalid game ID' });
    }

    const userId = req.user.id;
    const { cellIndex } = req.body;

    if (
      cellIndex === undefined ||
      typeof cellIndex !== 'number' ||
      !Number.isInteger(cellIndex) ||
      cellIndex < 0 ||
      cellIndex > 8
    ) {
      return res
        .status(400)
        .json({ error: 'Invalid cell index (must be 0-8)' });
    }

    const updatedGame = await makeMoveInDb(gameId, cellIndex, userId);

    return res.status(200).json(updatedGame);
  } catch (error: any) {
    console.error('Error making move:', error);

    if (error.message === 'Game not found') {
      return res.status(404).json({ error: 'Game not found' });
    }

    if (error.message.startsWith('Invalid move: ')) {
      const cleanMessage = error.message.replace('Invalid move: ', '');
      return res.status(400).json({ error: cleanMessage });
    }

    return res.status(500).json({ error: 'Failed to process move' });
  }
};
