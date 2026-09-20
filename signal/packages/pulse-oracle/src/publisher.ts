import { writeFile, mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { computePulseScore, getTreasuryBurnRate } from "@signal/pulse-core";
import type { PlatformInput, PulseSnapshot } from "@signal/pulse-core";

const DATA_DIR = process.env.SIGNAL_DATA_DIR ?? "./data/pulse";

export interface PublishResult {
  snapshot: PulseSnapshot;
  ipfsHash: string;
  treasuryBurn: number;
}

async function loadPrevScore(): Promise<number | null> {
  try {
    const latest = await readFile(join(DATA_DIR, "latest.json"), "utf-8");
    const parsed = JSON.parse(latest) as PulseSnapshot;
    return parsed.pulseScore;
  } catch {
    return null;
  }
}

function mockPlatformInputs(): PlatformInput[] {
  const now = Date.now();
  const variance = Math.sin(now / 3600000) * 0.3 + 0.7;

  return [
    {
      platform: "x",
      available: true,
      metrics: {
        mentionsLast1h: Math.floor(30000 * variance),
        mentionsPrev1h: Math.floor(22000 * variance),
        hashtagBirthRate: Math.floor(80 * variance),
        baselineBirthRate7d: 35,
        botFraction: 0.06,
        shillFraction: 0.02,
        coordinatedFraction: 0.09,
      },
    },
    {
      platform: "tiktok",
      available: true,
      metrics: {
        mentionsLast1h: Math.floor(65000 * variance),
        mentionsPrev1h: Math.floor(48000 * variance),
        hashtagBirthRate: Math.floor(70 * variance),
        baselineBirthRate7d: 28,
        botFraction: 0.04,
        shillFraction: 0.01,
        coordinatedFraction: 0.07,
      },
    },
    {
      platform: "reddit",
      available: true,
      metrics: {
        mentionsLast1h: Math.floor(9000 * variance),
        mentionsPrev1h: Math.floor(6800 * variance),
        hashtagBirthRate: Math.floor(12 * variance),
        baselineBirthRate7d: 7,
        botFraction: 0.1,
        shillFraction: 0.02,
        coordinatedFraction: 0.12,
      },
    },
    {
      platform: "youtube",
      available: true,
      metrics: {
        mentionsLast1h: Math.floor(18000 * variance),
        mentionsPrev1h: Math.floor(13000 * variance),
        hashtagBirthRate: Math.floor(20 * variance),
        baselineBirthRate7d: 10,
        botFraction: 0.03,
        shillFraction: 0.01,
        coordinatedFraction: 0.05,
      },
    },
    {
      platform: "googleTrends",
      available: true,
      metrics: {
        mentionsLast1h: Math.floor(4000 * variance),
        mentionsPrev1h: Math.floor(3000 * variance),
        hashtagBirthRate: Math.floor(4 * variance),
        baselineBirthRate7d: 2,
        botFraction: 0,
        shillFraction: 0,
        coordinatedFraction: 0,
      },
    },
  ];
}

function pseudoIpfsHash(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    hash = (hash << 5) - hash + content.charCodeAt(i);
    hash |= 0;
  }
  return `bafy${Math.abs(hash).toString(36)}`;
}

export async function publishHourlyPulse(): Promise<PublishResult> {
  await mkdir(DATA_DIR, { recursive: true });

  const prevScore = await loadPrevScore();
  const inputs = mockPlatformInputs();

  const snapshot = computePulseScore(inputs, {
    prevScore,
    topics: [
      {
        slug: "trending-now",
        label: "Trending Now",
        platforms: ["x", "tiktok", "reddit"],
      },
      {
        slug: "viral-format",
        label: "Viral Format",
        platforms: ["tiktok", "youtube"],
      },
    ],
  });

  const content = JSON.stringify(snapshot, null, 2);
  const ipfsHash = pseudoIpfsHash(content);
  const treasuryBurn = getTreasuryBurnRate(snapshot.event);

  const timestamp = snapshot.timestamp.replace(/[:.]/g, "-");
  await writeFile(join(DATA_DIR, "latest.json"), content);
  await writeFile(join(DATA_DIR, `pulse-${timestamp}.json`), content);

  const onChainMemo = {
    pulseScore: snapshot.pulseScore,
    status: snapshot.status,
    event: snapshot.event,
    ipfsHash,
    methodologyVersion: snapshot.methodologyVersion,
  };
  await writeFile(
    join(DATA_DIR, `onchain-${timestamp}.json`),
    JSON.stringify(onChainMemo, null, 2)
  );

  return { snapshot, ipfsHash, treasuryBurn };
}
