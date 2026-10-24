import express, { type Express } from "express";
import cors from "cors";
import { userRoutes } from "./routes/userRoutes";
import { postRoutes } from "./routes/postRoutes";
import { leaderboardRoutes } from "./routes/leaderboardRoutes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

export function createApp(): Express {
  const app = express();

  // CORS: only allow the configured client origin
  const clientUrl = process.env.CLIENT_URL;
  app.use(
    cors({
      origin: clientUrl ? [clientUrl] : [],
      methods: ["GET", "POST", "DELETE"],
      allowedHeaders: ["Content-Type", "x-admin-key"],
    })
  );
  app.use(express.json());

  // Routes
  app.use("/api/users", userRoutes);
  app.use("/api/posts", postRoutes);
  app.use("/api/leaderboard", leaderboardRoutes);

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ success: true, data: { status: "ok" } });
  });

  // 404 + error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
