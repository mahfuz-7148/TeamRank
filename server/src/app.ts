import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { authRoutes } from "./routes/authRoutes";
import { userRoutes } from "./routes/userRoutes";
import { postRoutes } from "./routes/postRoutes";
import { leaderboardRoutes } from "./routes/leaderboardRoutes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { originGuard } from "./middleware/originGuard";
import { getAllowedOrigins } from "./config/origins";

export function createApp(): Express {
  const app = express();

  // CORS: only the configured client origin(s), see config/origins.ts.
  // `credentials` is required so the browser sends/stores the auth cookie.
  const allowedOrigins = getAllowedOrigins();

  app.use(
    cors({
      origin(origin, callback) {
        // Allow same-origin / server-to-server requests (no Origin header)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        return callback(null, false);
      },
      credentials: true,
      methods: ["GET", "POST", "DELETE"],
      allowedHeaders: ["Content-Type", "x-admin-key"],
    })
  );
  app.use(originGuard);
  app.use(express.json());
  app.use(cookieParser());

  // Routes
  app.use("/api/auth", authRoutes);
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
