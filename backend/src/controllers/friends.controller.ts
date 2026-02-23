// Friends controller — handles HTTP request/response for friend operations
// Calls friends.service.ts for business logic

import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import {
  createFriendRequest,
} from "../services/friends.service";

export async function sendFriendRequest(req: AuthRequest, res: Response): Promise<void> {
  try {
    const requesterId: number = req.user.id;

    //Check Param Runtime
    const userIdParam = req.params.userId;

    if (!userIdParam || typeof userIdParam !== "string") {
      res.status(400).json({ error: "Invalid user ID" });
      return;
    }

    //Extract ID
    const addresseeId = parseInt(userIdParam, 10);  // ← corrigé

    if (isNaN(addresseeId)) {
      res.status(400).json({ error: "Invalid user ID" });
      return;
    }

    //Call service
    const friendRequest = await createFriendRequest(requesterId, addresseeId);  // ← corrigé

    res.status(201).json(friendRequest);

  } catch (error: any) {
    if (error.status) {
      res.status(error.status).json({ error: error.message });
      return;
    }
    console.error("sendFriendRequest error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
