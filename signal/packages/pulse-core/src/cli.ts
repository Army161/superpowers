#!/usr/bin/env node
import { computePulseScore } from "./compute.js";
import type { PlatformInput } from "./types.js";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const prevArg = args.find((a) => a.startsWith("--prev="));
const prevScore = prevArg ? Number(prevArg.split("=")[1]) : 68;

/** Demo inputs simulating a warming cultural moment */
const demoInputs: PlatformInput[] = [
  {
    platform: "x",
    available: true,
    metrics: {
      mentionsLast1h: 45000,
      mentionsPrev1h: 28000,
      hashtagBirthRate: 120,
      baselineBirthRate7d: 40,
      botFraction: 0.08,
      shillFraction: 0.02,
      coordinatedFraction: 0.1,
    },
  },
  {
    platform: "tiktok",
    available: true,
    metrics: {
      mentionsLast1h: 82000,
      mentionsPrev1h: 51000,
      hashtagBirthRate: 85,
      baselineBirthRate7d: 30,
      botFraction: 0.05,
      shillFraction: 0.01,
      coordinatedFraction: 0.08,
    },
  },
  {
    platform: "reddit",
    available: true,
    metrics: {
      mentionsLast1h: 12000,
      mentionsPrev1h: 7500,
      hashtagBirthRate: 15,
      baselineBirthRate7d: 8,
      botFraction: 0.12,
      shillFraction: 0.03,
      coordinatedFraction: 0.15,
    },
  },
  {
    platform: "youtube",
    available: true,
    metrics: {
      mentionsLast1h: 22000,
      mentionsPrev1h: 14000,
      hashtagBirthRate: 25,
      baselineBirthRate7d: 12,
      botFraction: 0.04,
      shillFraction: 0.01,
      coordinatedFraction: 0.06,
    },
  },
  {
    platform: "googleTrends",
    available: true,
    metrics: {
      mentionsLast1h: 5000,
      mentionsPrev1h: 3200,
      hashtagBirthRate: 5,
      baselineBirthRate7d: 3,
      botFraction: 0,
      shillFraction: 0,
      coordinatedFraction: 0,
    },
  },
];

const snapshot = computePulseScore(demoInputs, {
  prevScore,
  topics: [
    { slug: "viral-moment-2026", label: "Viral Moment", platforms: ["x", "tiktok", "reddit"] },
    { slug: "meme-format-spread", label: "Meme Format", platforms: ["tiktok", "youtube"] },
    { slug: "breaking-culture", label: "Breaking Culture", platforms: ["x", "reddit"] },
  ],
});

if (dryRun) {
  console.log("=== Culture Pulse Compute (dry-run) ===");
}
console.log(JSON.stringify(snapshot, null, 2));
