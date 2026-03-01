import { Router } from "express";
import { getChatHistory, getConversationList } from "../controllers/chat.controller";
import { auth } from "../middleware/auth";

const router = Router();

// Must be defined before /:userId to avoid Express matching "conversations" as a param
router.get("/conversations", auth, getConversationList);
router.get("/:userId", auth, getChatHistory);

export default router;
