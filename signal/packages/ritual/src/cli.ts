#!/usr/bin/env node
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { preparePulseCheck } from "./pulse-check.js";
import { submitGrant } from "./grants.js";

const args = process.argv.slice(2);
const live = args.includes("--live");
const demoGrant = args.includes("--demo-grant");

if (demoGrant) {
  await submitGrant({
    walletAddress: "DemoWallet111111111111111111111111111",
    forgeCardUrl: "https://forge.signal/card/demo-001",
    sourceLink: "https://x.com/example/status/123",
    context: "Viral moment captured during launch week",
    signalProofCompleted: true,
  });
  console.log("Demo grant submission created.");
}

const brief = await preparePulseCheck(live);

console.log("=== Daily Pulse Check Brief ===\n");
console.log(brief.announcement);
console.log("\n--- X Spaces Script ---");
for (const line of brief.spacesScript) {
  console.log(line);
}

const outDir = join(process.cwd(), "data/ritual");
await mkdir(outDir, { recursive: true });
const outPath = join(outDir, `pulse-check-${brief.timestamp.replace(/[:.]/g, "-")}.json`);
await writeFile(outPath, JSON.stringify(brief, null, 2));
console.log(`\nBrief saved to ${outPath}`);
