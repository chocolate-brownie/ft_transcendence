import { Request, Response } from 'express';
import { createAIGame } from '../services/ai.service';

export const generateAIGame = async (req: Request, res: Response) => {
  try {
    const { difficulty, playerSymbol } = req.body;
    const userId = req.user.id;

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
