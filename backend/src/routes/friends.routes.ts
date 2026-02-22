import { Router } from "express";
import { sendFriendRequest } from "../controllers/friends.controller";
import { auth } from "../middleware/auth";

const router = Router();

// GET    /api/friends
// GET    /api/friends/requests
router.post("/request/:userId", auth, sendFriendRequest);

// POST   /api/friends/request/:userId
// POST   /api/friends/accept/:requestId
// DELETE /api/friends/:friendId

export default router;
