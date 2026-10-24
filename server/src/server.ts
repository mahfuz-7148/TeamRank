import "dotenv/config";
import { createApp } from "./app";
import { connectDB } from "./config/db";

async function main(): Promise<void> {
  await connectDB();

  const port = Number(process.env.PORT) || 5000;
  const app = createApp();

  app.listen(port, () => {
    console.log(`[server] TeamRank API running on http://localhost:${port}`);
  });
}

main().catch((err) => {
  console.error("[server] Failed to start:", err);
  process.exit(1);
});
