#!/usr/bin/env node
/**
 * Scheduler for daily Pulse Check ritual.
 * Prep at 15:00 UTC, go-live at 16:00 UTC.
 *
 * Usage:
 *   node dist/scheduler.js          # start scheduler
 *   node dist/scheduler.js --once   # run prep now
 */

import { preparePulseCheck } from "./pulse-check.js";

const PREP_HOUR_UTC = 15;
const LIVE_HOUR_UTC = 16;

async function runPrep() {
  console.log(`[${new Date().toISOString()}] Running Pulse Check prep...`);
  const brief = await preparePulseCheck(false);
  console.log(brief.announcement);
}

async function runLive() {
  console.log(`[${new Date().toISOString()}] Pulse Check LIVE`);
  const brief = await preparePulseCheck(true);
  console.log(brief.announcement);
  for (const line of brief.spacesScript) {
    console.log(line);
  }
}

function msUntilHour(hour: number): number {
  const now = new Date();
  const target = new Date(now);
  target.setUTCHours(hour, 0, 0, 0);
  if (target <= now) target.setUTCDate(target.getUTCDate() + 1);
  return target.getTime() - now.getTime();
}

function scheduleDaily(hour: number, fn: () => Promise<void>) {
  const run = async () => {
    await fn();
    setTimeout(run, 24 * 60 * 60 * 1000);
  };
  setTimeout(run, msUntilHour(hour));
  console.log(`Scheduled for ${hour}:00 UTC (in ${Math.round(msUntilHour(hour) / 60000)} min)`);
}

const args = process.argv.slice(2);

if (args.includes("--once")) {
  await runPrep();
} else {
  console.log("Pulse Check scheduler started.");
  console.log(`Prep: ${PREP_HOUR_UTC}:00 UTC | Live: ${LIVE_HOUR_UTC}:00 UTC`);
  scheduleDaily(PREP_HOUR_UTC, runPrep);
  scheduleDaily(LIVE_HOUR_UTC, runLive);
}
