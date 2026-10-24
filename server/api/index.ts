import type { IncomingMessage, ServerResponse } from "http";
import { createApp } from "../src/app";
import { connectDB } from "../src/config/db";

const app = createApp();

/**
 * Vercel serverless entry point.
 * Vercel rewrites every request here (see vercel.json); Express handles routing.
 */
export default async function handler(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  try {
    await connectDB();
  } catch {
    res.statusCode = 503;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        success: false,
        message: "Database connection failed",
      })
    );
    return;
  }

  // Express app is a valid (req, res) request listener
  app(req, res);
}
