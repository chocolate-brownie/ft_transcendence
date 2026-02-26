// Chat controller — handles HTTP request/response for chat/messages
// Calls chat.service.ts for business logic
import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import {
  userExists,
  areFriends,
  getChatHistoryPaginated,
} from "../services/chat.service";

export async function getChatHistory(req: AuthRequest, res: Response): Promise<void> {
  try {
    const currentUserId = req.user?.id;
    if (!currentUserId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    // Extract and validate userId param
    const { userId } = req.params;
    const otherUserId = parseInt(userId, 10);

    if (isNaN(otherUserId) || otherUserId <= 0) {
      res.status(400).json({ error: "Invalid user ID" });
      return;
    }

    // Prevent user from fetching their own chat history
    if (otherUserId === currentUserId) {
      res.status(400).json({ error: "Cannot fetch chat history with yourself" });
      return;
    }

    // Extract pagination params
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 50, 100);
    const before = req.query.before ? parseInt(req.query.before as string, 10) : undefined;

    // Check if target user exists
    const targetUserExists = await userExists(otherUserId);
    if (!targetUserExists) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Check if users are friends
    const isFriends = await areFriends(currentUserId, otherUserId);
    if (!isFriends) {
      res.status(403).json({ error: "You are not friends with this user" });
      return;
    }

    // Fetch chat history with pagination
    const result = await getChatHistoryPaginated(
      currentUserId,
      otherUserId,
      limit,
      before,
    );

    res.status(200).json(result);
  } catch (error) {
    console.error("[getChatHistory] Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
