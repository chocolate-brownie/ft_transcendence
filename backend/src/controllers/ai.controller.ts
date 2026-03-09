import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { createAIGame, makeAIMove, getAIGameById }from '../services/ai.service';

export const generateAIGame = async (req: AuthRequest, res: Response) => {
  try {
    const { difficulty, playerSymbol } = req.body;
    const userId = req.user?.id;

    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
      return res.status(400).json({ error: 'Invalid difficulty level' });
    }

    if (!['X', 'O'].includes(playerSymbol)) {
      return res.status(400).json({ error: 'Invalid player symbol' });
    }

    const game = await createAIGame(userId, difficulty, playerSymbol);

    res.status(201).json(game);
  } catch (error) {
    console.error('Error trying to play against AI:', error);
    res.status(500).json({ error: 'Failed to generate AI game' });
  }
};

export const RequestAIMove = async (req: AuthRequest, res: Response) => {
  try {
    const gameId = Array.isArray(req.params.id) ? parseInt(req.params.id[0]) : parseInt(req.params.id);
    const { moveIndex } = req.body;
    const userId = req.user?.id;

    if (typeof moveIndex !== 'number' || moveIndex < 0 || moveIndex > 8) {
      return res.status(400).json({ error: 'Invalid move index' });
    }

    const game = await makeAIMove(gameId, userId, moveIndex);

    res.json(game);
  } catch (error: any) {
    if (error.message === 'Game not found') {
      return res.status(404).json({ error: 'Game not found' });
    }
    if (error.message === 'Game is not in progress') {
      return res.status(400).json({ error: 'Game is not in progress' });
    }
    if (error.message === 'Not your game') {
      return res.status(403).json({ error: 'Not your game' });
    }
    if (error.message === 'Not your turn') {
      return res.status(400).json({ error: 'Not your turn' });
    }
    if (error.message === 'Cell is already occupied') {
      return res.status(400).json({ error: 'Cell is already occupied' });
    }

    console.error('Error trying to make move:', error);
    res.status(500).json({ error: 'Failed to make move' });
  }
};

export const getAIGame = async (req: AuthRequest, res: Response) => {
  try {
    const gameId = Array.isArray(req.params.id) ? parseInt(req.params.id[0]) : parseInt(req.params.id);
    const userId = req.user?.id;

    const game = await getAIGameById(gameId, userId);

    res.json(game);
  } catch (error: any) {
    if (error.message === 'Game not found') {
      return res.status(404).json({ error: 'Game not found' });
    }
    if (error.message === 'Not your game') {
      return res.status(403).json({ error: 'Not your game' });
    }

    console.error('Error fetching game:', error);
    res.status(500).json({ error: 'Failed to fetch game' });
  }
};
