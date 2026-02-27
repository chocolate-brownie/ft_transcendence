import { Router } from "express";
import { auth } from "../middleware/auth";
import {
  getFriendsList,
  getPendingRequestsController,
  getFriendshipStatusController,
  sendFriendRequest,
  acceptFriendRequestController,
  deleteFriend,
} from "../controllers/friends.controller";

const router = Router();

// GET    /api/friends
router.get("/", auth, getFriendsList);

// GET    /api/friends/requests
router.get("/requests", auth, getPendingRequestsController);

// GET /api/friends/status/:userId
router.get("/status/:userId", auth, getFriendshipStatusController);

// POST   /api/friends/request/:userId
router.post("/request/:userId", auth, sendFriendRequest);

// POST   /api/friends/accept/:requestId
router.post("/accept/:requestId", auth, acceptFriendRequestController);

// DELETE /api/friends/:friendId
router.delete("/:friendId", auth, deleteFriend);

export default router;
