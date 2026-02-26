import { Router } from "express";
import { getChatHistory } from "../controllers/chat.controller";
import { auth } from "../middleware/auth";

const router = Router();

router.get("/:userId", auth, getChatHistory);

export default router;
