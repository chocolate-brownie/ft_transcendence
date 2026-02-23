// Friends controller — handles HTTP request/response for friend operations
// Calls friends.service.ts for business logic

import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import {
  createFriendRequest,
  acceptFriendRequest,
  removeFriend,
} from "../services/friends.service";

//      SEND FRIEND REQUEST

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
    const addresseeId = parseInt(userIdParam, 10);

    if (isNaN(addresseeId)) {
      res.status(400).json({ error: "Invalid user ID" });
      return;
    }

    //Call service
    const friendRequest = await createFriendRequest(requesterId, addresseeId);

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

//    ACCEPT FRIEND REQUEST

export async function acceptFriendRequestController(req: AuthRequest, res: Response): Promise<void> {
  try {
    const currentUserId: number = req.user.id;
    const requestIdParam = req.params.requestId;

    if (!requestIdParam) {
      res.status(400).json({ error: "Invalid request ID" });
      return;
    }

    const requestId = parseInt(requestIdParam as string, 10);

    if (isNaN(requestId)) {
      res.status(400).json({ error: "Invalid request ID" });
      return;
    }

    const updatedRequest = await acceptFriendRequest(requestId, currentUserId);

    res.status(200).json(updatedRequest);

  } catch (error: any) {
    if (error.status) {
      res.status(error.status).json({ error: error.message });
      return;
    }
    console.error("acceptFriendRequest error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

//    DELETE FRIEND / REJECT REQUEST

export async function deleteFriend(req: AuthRequest, res: Response): Promise<void> {
  try {
    const currentUserId: number = req.user.id;
    const friendIdParam = req.params.friendId;

    if (!friendIdParam) {
      res.status(400).json({ error: "Invalid friend ID" });
      return;
    }

    const friendId = parseInt(friendIdParam as string, 10);

    if (isNaN(friendId)) {
      res.status(400).json({ error: "Invalid friend ID" });
      return;
    }

    await removeFriend(friendId, currentUserId);

    res.status(204).send();

  } catch (error: any) {
    if (error.status) {
      res.status(error.status).json({ error: error.message });
      return;
    }
    console.error("deleteFriend error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
