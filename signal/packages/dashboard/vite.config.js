import { defineConfig } from "vite";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export default defineConfig({
  server: { port: 3848 },
  plugins: [
    {
      name: "pulse-api",
      configureServer(server) {
        server.middlewares.use("/api/pulse/latest", async (_req, res) => {
          try {
            const raw = await readFile(
              join(process.cwd(), "../../data/pulse/latest.json"),
              "utf-8"
            );
            res.setHeader("Content-Type", "application/json");
            res.end(raw);
          } catch {
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({
              pulseScore: 72,
              status: "OK",
              event: null,
              platformBreakdown: { x: 0.78, tiktok: 0.65, reddit: 0.71, youtube: 0.42, googleTrends: 0.55 },
              topTopics: ["trending-now", "viral-format"],
              timestamp: new Date().toISOString(),
            }));
          }
        });
      },
    },
  ],
});
