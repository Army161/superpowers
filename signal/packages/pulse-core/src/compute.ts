import calibration from "./calibration.json" with { type: "json" };
import {
  applyManipulationDiscount,
  clamp,
  hashtagBirthRate,
  mentionAcceleration,
} from "./normalize.js";
import type {
  ComputeOptions,
  Platform,
  PlatformInput,
  PulseEventName,
  PulseSnapshot,
  PulseStatus,
  TopicCluster,
} from "./types.js";

const METHODOLOGY_VERSION = "1.0.0";
const EXCLUDED_KEYWORDS = ["$signal", "#culturepulse", "#signalpulse", "signal token"];

function platformSubScore(input: PlatformInput): number {
  if (!input.available) return 0;

  const { metrics } = input;
  const accel = mentionAcceleration(
    metrics.mentionsLast1h,
    metrics.mentionsPrev1h
  );
  const birth = hashtagBirthRate(
    metrics.hashtagBirthRate,
    metrics.baselineBirthRate7d
  );

  const raw = accel * 0.6 + birth * 0.4;
  return applyManipulationDiscount(
    raw,
    metrics.botFraction,
    metrics.shillFraction,
    metrics.coordinatedFraction
  );
}

function spreadBonus(topics: TopicCluster[]): number {
  const multiPlatform = topics.filter((t) => t.platforms.length >= 2).length;
  if (multiPlatform === 0) return 0;

  const maxPlatforms = Math.max(...topics.map((t) => t.platforms.length));
  const bonus =
    calibration.spreadBonusPerPlatform * (maxPlatforms - 1);
  return Math.min(bonus, calibration.maxSpreadBonus);
}

function detectEvent(
  pulseScore: number,
  prevScore: number | null
): PulseEventName {
  if (prevScore === null) return null;

  const { warm, hot, peak } = calibration.pulseThresholds;

  if (prevScore < peak && pulseScore >= peak) return "PulsePeak";
  if (prevScore < hot && pulseScore >= hot) return "PulseHot";
  if (prevScore < warm && pulseScore >= warm) return "PulseWarm";

  return null;
}

function filterExcludedTopics(topics: TopicCluster[]): TopicCluster[] {
  return topics.filter((t) => {
    const lower = t.label.toLowerCase();
    return !EXCLUDED_KEYWORDS.some((kw) => lower.includes(kw));
  });
}

export function computePulseScore(
  inputs: PlatformInput[],
  options: ComputeOptions = {}
): PulseSnapshot {
  const topics = filterExcludedTopics(options.topics ?? []);
  const prevScore = options.prevScore ?? null;

  const unavailableCount = inputs.filter((i) => !i.available).length;
  const status: PulseStatus =
    unavailableCount >= 2 ? "DEGRADED" : "OK";

  const breakdown: Partial<Record<Platform, number>> = {};
  let weightedSum = 0;
  let weightTotal = 0;

  for (const input of inputs) {
    const weight =
      calibration.platformWeights[
        input.platform as keyof typeof calibration.platformWeights
      ] ?? 0;
    const sub = platformSubScore(input);
    breakdown[input.platform] = Math.round(sub * 100) / 100;

    if (input.available) {
      weightedSum += weight * sub;
      weightTotal += weight;
    }
  }

  if (status === "DEGRADED" || weightTotal === 0) {
    return {
      version: 1,
      timestamp: new Date().toISOString(),
      pulseScore: null,
      status: "DEGRADED",
      event: null,
      prevScore,
      platformBreakdown: breakdown,
      topTopics: topics.slice(0, 3).map((t) => t.slug),
      methodologyVersion: METHODOLOGY_VERSION,
    };
  }

  const normalized = weightedSum / weightTotal;
  const withSpread = normalized + spreadBonus(topics);
  const pulseScore = Math.round(clamp(withSpread * 100, 0, 100));
  const event = detectEvent(pulseScore, prevScore);

  return {
    version: 1,
    timestamp: new Date().toISOString(),
    pulseScore,
    status: "OK",
    event,
    prevScore,
    platformBreakdown: breakdown,
    topTopics: topics.slice(0, 3).map((t) => t.slug),
    methodologyVersion: METHODOLOGY_VERSION,
  };
}

export function getTreasuryBurnRate(event: PulseEventName): number {
  if (!event) return 0;
  return (
    calibration.treasuryBurnRates[
      event as keyof typeof calibration.treasuryBurnRates
    ] ?? 0
  );
}
