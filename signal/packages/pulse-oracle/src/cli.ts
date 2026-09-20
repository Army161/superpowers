#!/usr/bin/env node
import { publishHourlyPulse } from "./publisher.js";

const args = process.argv.slice(2);
const watch = args.includes("--watch");

async function runOnce() {
  const result = await publishHourlyPulse();
  console.log("Published Culture Pulse:");
  console.log(JSON.stringify(result.snapshot, null, 2));
  console.log(`IPFS hash: ${result.ipfsHash}`);
  if (result.treasuryBurn > 0) {
    console.log(`Treasury burn rate: ${(result.treasuryBurn * 100).toFixed(3)}%`);
  }
}

if (watch) {
  console.log("Oracle watching — publishing hourly...");
  await runOnce();
  setInterval(runOnce, 60 * 60 * 1000);
} else {
  await runOnce();
}
