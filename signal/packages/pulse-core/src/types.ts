export type Platform = "x" | "tiktok" | "reddit" | "youtube" | "googleTrends";

export type PulseStatus = "OK" | "DEGRADED";

export type PulseEventName = "PulseWarm" | "PulseHot" | "PulsePeak" | null;

export interface PlatformMetrics {
  mentionsLast1h: number;
  mentionsPrev1h: number;
  hashtagBirthRate: number;
  baselineBirthRate7d: number;
  botFraction: number;
  shillFraction: number;
  coordinatedFraction: number;
}

export interface PlatformInput {
  platform: Platform;
  metrics: PlatformMetrics;
  available: boolean;
}

export interface TopicCluster {
  slug: string;
  label: string;
  platforms: Platform[];
}

export interface PulseSnapshot {
  version: 1;
  timestamp: string;
  pulseScore: number | null;
  status: PulseStatus;
  event: PulseEventName;
  prevScore: number | null;
  platformBreakdown: Partial<Record<Platform, number>>;
  topTopics: string[];
  methodologyVersion: string;
}

export interface ComputeOptions {
  topics?: TopicCluster[];
  prevScore?: number | null;
}
