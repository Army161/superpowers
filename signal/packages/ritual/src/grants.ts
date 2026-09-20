import { writeFile, readFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

export interface GrantSubmission {
  id: string;
  walletAddress: string;
  forgeCardUrl: string;
  sourceLink: string;
  context?: string;
  signalProofCompleted: boolean;
  submittedAt: string;
  status: "pending" | "winner" | "rejected";
  score?: number;
}

const GRANTS_DIR = process.env.SIGNAL_GRANTS_DIR ?? "./data/grants";

export async function submitGrant(
  submission: Omit<GrantSubmission, "id" | "submittedAt" | "status">
): Promise<GrantSubmission> {
  await mkdir(GRANTS_DIR, { recursive: true });

  const entry: GrantSubmission = {
    ...submission,
    id: randomUUID(),
    submittedAt: new Date().toISOString(),
    status: "pending",
  };

  const day = new Date().toISOString().split("T")[0];
  await writeFile(
    join(GRANTS_DIR, `${day}-${entry.id}.json`),
    JSON.stringify(entry, null, 2)
  );

  return entry;
}

export function scoreSubmission(sub: GrantSubmission): number {
  let score = 50;

  if (sub.signalProofCompleted) score += 20;
  if (sub.context && sub.context.length > 10) score += 10;
  if (sub.forgeCardUrl.includes("forge")) score += 10;
  if (sub.sourceLink.includes("tiktok") || sub.sourceLink.includes("x.com")) {
    score += 10;
  }

  return Math.min(score, 100);
}

export async function selectDailyWinner(
  date?: string
): Promise<GrantSubmission | null> {
  const day = date ?? new Date().toISOString().split("T")[0];
  await mkdir(GRANTS_DIR, { recursive: true });

  const { readdir } = await import("node:fs/promises");
  const files = await readdir(GRANTS_DIR);
  const dayFiles = files.filter((f) => f.startsWith(day) && f.endsWith(".json"));

  if (dayFiles.length === 0) return null;

  const submissions: GrantSubmission[] = [];
  for (const file of dayFiles) {
    const raw = await readFile(join(GRANTS_DIR, file), "utf-8");
    const sub = JSON.parse(raw) as GrantSubmission;
    sub.score = scoreSubmission(sub);
    submissions.push(sub);
  }

  submissions.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  const winner = submissions[0];

  winner.status = "winner";
  await writeFile(
    join(GRANTS_DIR, `${day}-${winner.id}.json`),
    JSON.stringify(winner, null, 2)
  );

  return winner;
}
