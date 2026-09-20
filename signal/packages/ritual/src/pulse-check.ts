import { publishHourlyPulse } from "@signal/pulse-oracle";
import { selectDailyWinner } from "./grants.js";

export interface PulseCheckBrief {
  timestamp: string;
  pulseScore: number | null;
  status: string;
  event: string | null;
  topTopics: string[];
  announcement: string;
  spacesScript: string[];
  grantWinner: {
    wallet: string;
    score: number;
    sourceLink: string;
  } | null;
}

export async function preparePulseCheck(live = false): Promise<PulseCheckBrief> {
  const { snapshot } = await publishHourlyPulse();
  const winner = await selectDailyWinner();

  const scoreDisplay =
    snapshot.pulseScore !== null ? snapshot.pulseScore.toString() : "DEGRADED";
  const topicsDisplay =
    snapshot.topTopics.length > 0
      ? snapshot.topTopics.join(" · ")
      : "monitoring...";

  const announcement = live
    ? `🔴 Pulse Check LIVE

Score: ${scoreDisplay}
Topics: ${topicsDisplay}

Join: [X Spaces link]
$SIGNAL // culture is the product`
    : `Pulse Check in 1 hour.

Score: ${scoreDisplay}
Topics: ${topicsDisplay}

Set a reminder — 4pm UTC daily.`;

  const spacesScript = [
    `[OPEN] Welcome to Pulse Check. Today’s pulseScore is ${scoreDisplay}.`,
    `[MOMENTS] Top 3 cultural accelerations: ${topicsDisplay}.`,
    snapshot.event
      ? `[EVENT] Pulse Event fired: ${snapshot.event}. Treasury burn executed.`
      : `[EVENT] No new threshold crossings today.`,
    winner
      ? `[GRANT] Today’s creator grant (1 SOL) → ${winner.walletAddress.slice(0, 8)}... (score: ${winner.score})`
      : `[GRANT] No submissions today — budget rolls to billboard fund.`,
    `[CLOSE] Same time tomorrow. Culture is the product.`,
  ];

  return {
    timestamp: new Date().toISOString(),
    pulseScore: snapshot.pulseScore,
    status: snapshot.status,
    event: snapshot.event,
    topTopics: snapshot.topTopics,
    announcement,
    spacesScript,
    grantWinner: winner
      ? {
          wallet: winner.walletAddress,
          score: winner.score ?? 0,
          sourceLink: winner.sourceLink,
        }
      : null,
  };
}
