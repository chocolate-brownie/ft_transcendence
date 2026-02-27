import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { createGameInDb, CREATE_ERRORS } from "../services/games.service";
import prisma from "../lib/prisma";

export const createGame = async (req: AuthRequest, res: Response) => {
  try {
    const player1Id: number = req.user.id;
    const { player2Id } = req.body;

    // ── Validations si player2Id fourni ──

    if (player2Id != null) {

      // On ne peut pas jouer contre soi-même
      if (player2Id === player1Id) {
        return res.status(400).json({ error: CREATE_ERRORS.SELF_PLAY });
      }

      // Le joueur 2 existe ?
      const player2 = await prisma.user.findUnique({
        where: { id: player2Id },
      });
      if (!player2) {
        return res.status(400).json({ error: CREATE_ERRORS.PLAYER_NOT_FOUND });
      }

      // Les deux joueurs sont amis ?
      const friendship = await prisma.friend.findFirst({
        where: {
          status: "ACCEPTED",
          OR: [
            { requesterId: player1Id, addresseeId: player2Id },
            { requesterId: player2Id, addresseeId: player1Id },
          ],
        },
      });
      if (!friendship) {
        return res.status(403).json({ error: CREATE_ERRORS.NOT_FRIENDS });
      }
    }

    // ── Création de la partie ──

    const game = await createGameInDb(player1Id, player2Id ?? undefined);

    return res.status(201).json(game);
  } catch (error) {
    console.error("Error creating game:", error);
    return res.status(500).json({ error: "Failed to create game" });
  }
};
