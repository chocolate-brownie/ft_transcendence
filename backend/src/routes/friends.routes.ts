import { Router } from "express";
import { auth } from "../middleware/auth";
import {
  sendFriendRequest,
} from "../controllers/friends.controller";

const router = Router();

// GET    /api/friends
// GET    /api/friends/requests

// POST   /api/friends/request/:userId
router.post("/request/:userId", auth, sendFriendRequest);

// POST   /api/friends/accept/:requestId
// DELETE /api/friends/:friendId

export default router;
