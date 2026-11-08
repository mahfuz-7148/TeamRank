import { Router } from "express";
import { getLeaderboard } from "../controllers/leaderboardController";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

router.get("/", requireAuth, getLeaderboard);

export { router as leaderboardRoutes };
