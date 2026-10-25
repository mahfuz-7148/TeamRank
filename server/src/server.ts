import "dotenv/config";
import { createServer } from "node:http";
import { Server as SocketServer } from "socket.io";
import { createApp } from "./app";
import { connectDB } from "./config/db";
import { getAllowedOrigins } from "./config/origins";
import { setRealtimeServer } from "./realtime";

async function main(): Promise<void> {
  await connectDB();

  const port = Number(process.env.PORT) || 5000;
  const app = createApp();

  // Socket.IO needs a long-running HTTP server. This entry point
  // (src/server.ts) is for local dev and persistent hosts like
  // Render / Railway / Fly / a VPS. Vercel's serverless entry
  // (api/index.ts) does not attach Socket.IO — see DEPLOY.md.
  const httpServer = createServer(app);
  const io = new SocketServer(httpServer, {
    cors: {
      origin: getAllowedOrigins(),
      methods: ["GET", "POST"],
    },
  });

  setRealtimeServer(io);

  io.on("connection", (socket) => {
    console.log(`[socket] connected: ${socket.id}`);
    socket.on("disconnect", (reason) => {
      console.log(`[socket] disconnected: ${socket.id} (${reason})`);
    });
  });

  httpServer.listen(port, () => {
    console.log(`[server] TeamRank API running on http://localhost:${port}`);
    console.log(`[socket] Socket.IO listening on the same port`);
  });
}

main().catch((err) => {
  console.error("[server] Failed to start:", err);
  process.exit(1);
});
