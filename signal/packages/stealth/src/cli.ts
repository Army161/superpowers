#!/usr/bin/env node
import { join } from "node:path";
import { generateStealthAssets } from "./generator.js";

const outDir = join(process.cwd(), "assets/stealth/generated");

const posts = await generateStealthAssets(outDir);

console.log("=== Stealth Campaign Assets Generated ===");
console.log(`Output: ${outDir}`);
console.log(`Posts: ${posts.length}`);
for (const post of posts) {
  console.log(`  Day ${post.day} (${post.date}): ${post.postType} [${post.waveformState}]`);
}
console.log("\nSee CONTENT_CALENDAR.md for full 30-day plan.");
