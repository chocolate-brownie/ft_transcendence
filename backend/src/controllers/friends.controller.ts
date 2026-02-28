// Friends controller — handles HTTP request/response for friend operations
// Calls friends.service.ts for business logic

import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import {
  createFriendRequest,
  acceptFriendRequest,
  removeFriend,
  rejectFriendRequest,
  getAcceptedFriends,
  getPendingRequests,
  getFriendshipStatus,
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
    const addresseeId = Number(userIdParam);
    if (Number.isNaN(addresseeId)) {
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

export async function acceptFriendRequestController(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  try {
    const currentUserId: number = req.user.id;
    const requestIdParam = req.params.requestId;

    if (!requestIdParam) {
      res.status(400).json({ error: "Invalid request ID" });
      return;
    }

    const requestId = Number(requestIdParam);
    if (Number.isNaN(requestId)) {
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

    const friendId = Number(friendIdParam);
    if (Number.isNaN(friendId)) {
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

export async function rejectFriendRequestController(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  try {
    const currentUserId: number = req.user.id;
    const senderIdParam = req.params.senderId;

    if (!senderIdParam) {
      res.status(400).json({ error: "Invalid sender ID" });
      return;
    }

    const senderId = Number(senderIdParam);
    if (Number.isNaN(senderId)) {
      res.status(400).json({ error: "Invalid sender ID" });
      return;
    }

    await rejectFriendRequest(senderId, currentUserId);
    res.status(204).send();
  } catch (error: any) {
    if (error.status) {
      res.status(error.status).json({ error: error.message });
      return;
    }
    console.error("rejectFriendRequest error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

//  GET FRIEND LIST

export async function getFriendsList(req: AuthRequest, res: Response): Promise<void> {
  try {
    const currentUserId: number = req.user.id;

    const friends = await getAcceptedFriends(currentUserId);

    res.status(200).json(friends);
  } catch (error: any) {
    if (error.status) {
      res.status(error.status).json({ error: error.message });
      return;
    }
    console.error("getFriendsList error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

//    GET PENDING FRIEND REQUESTS

export async function getPendingRequestsController(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  try {
    const currentUserId: number = req.user.id;

    const requests = await getPendingRequests(currentUserId);

    res.status(200).json(requests);
  } catch (error: any) {
    if (error.status) {
      res.status(error.status).json({ error: error.message });
      return;
    }
    console.error("getPendingRequests error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// GET FRIENDSHIP STATUS
export async function getFriendshipStatusController(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  try {
    const currentUserId = req.user.id;
    const targetParam = req.params.userId;

    if (!targetParam || Number.isNaN(Number(targetParam))) {
      res.status(400).json({ error: "Invalid user ID" });
      return;
    }
    const targetUserId = Number(targetParam);

    const status = await getFriendshipStatus(currentUserId, targetUserId);
    res.status(200).json({ status });
  } catch (error: any) {
    if (error.status) {
      res.status(error.status).json({ error: error.message });
      return;
    }
    console.error("getFriendshipStatus error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
