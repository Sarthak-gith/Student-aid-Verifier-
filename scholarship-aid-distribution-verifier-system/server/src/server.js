import app from "./app.js";
import { closePool } from "./config/db.js";
import { env } from "./config/env.js";

async function startServer() {
  const server = app.listen(env.port, () => {
    console.log(`Server running on http://localhost:${env.port}`);
  });

  server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      console.error(
        `Port ${env.port} is already in use. Stop the other process or set a different PORT in server/.env.`
      );
      process.exit(1);
    }

    console.error("Failed to start server:", error);
    process.exit(1);
  });
}

process.on("SIGINT", async () => {
  await closePool();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await closePool();
  process.exit(0);
});

startServer();
