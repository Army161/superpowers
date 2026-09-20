import type { Plugin } from "vite";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export function pulseApiPlugin(): Plugin {
  const dataPath = join(process.cwd(), "../../data/pulse/latest.json");

  return {
    name: "pulse-api",
    configureServer(server) {
      server.middlewares.use("/api/pulse/latest", async (_req, res) => {
        try {
          const raw = await readFile(dataPath, "utf-8");
          const data = JSON.parse(raw);

          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({
              pulseScore: data.pulseScore ?? 45,
              txHash: `pulse_${data.timestamp?.replace(/[-:T.Z]/g, "").slice(0, 24) ?? "demo"}`,
              topTopics: data.topTopics ?? [],
            })
          );
        } catch {
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({
              pulseScore: 72,
              txHash: "5Kq7xPulseWarm20260920160000abc123",
              topTopics: ["trending-now", "viral-format"],
            })
          );
        }
      });
    },
  };
}
