import { describe, it } from "node:test";
import assert from "node:assert";
import { computePulseScore } from "./compute.js";
import { mentionAcceleration, hashtagBirthRate } from "./normalize.js";
import type { PlatformInput } from "./types.js";

describe("normalize", () => {
  it("mentionAcceleration increases with velocity", () => {
    const low = mentionAcceleration(100, 100);
    const high = mentionAcceleration(500, 100);
    assert.ok(high > low);
  });

  it("hashtagBirthRate caps at 5x baseline", () => {
    assert.strictEqual(hashtagBirthRate(500, 10), 1.0);
    assert.ok(hashtagBirthRate(25, 10) < 1.0);
  });
});

describe("computePulseScore", () => {
  const baseInput = (platform: PlatformInput["platform"], available = true): PlatformInput => ({
    platform,
    available,
    metrics: {
      mentionsLast1h: 1000,
      mentionsPrev1h: 500,
      hashtagBirthRate: 10,
      baselineBirthRate7d: 5,
      botFraction: 0,
      shillFraction: 0,
      coordinatedFraction: 0,
    },
  });

  it("returns score in 0-100 range", () => {
    const inputs = ["x", "tiktok", "reddit", "youtube", "googleTrends"].map((p) =>
      baseInput(p as PlatformInput["platform"])
    );
    const result = computePulseScore(inputs, { prevScore: 30 });
    assert.ok(result.pulseScore !== null);
    assert.ok(result.pulseScore! >= 0 && result.pulseScore! <= 100);
    assert.strictEqual(result.status, "OK");
  });

  it("returns DEGRADED when 2+ sources unavailable", () => {
    const inputs = [
      baseInput("x", false),
      baseInput("tiktok", false),
      baseInput("reddit", true),
      baseInput("youtube", true),
      baseInput("googleTrends", true),
    ];
    const result = computePulseScore(inputs);
    assert.strictEqual(result.status, "DEGRADED");
    assert.strictEqual(result.pulseScore, null);
  });

  it("fires PulseWarm when crossing threshold", () => {
    const inputs = ["x", "tiktok", "reddit", "youtube", "googleTrends"].map((p) => ({
      ...baseInput(p as PlatformInput["platform"]),
      metrics: {
        mentionsLast1h: 100000,
        mentionsPrev1h: 10000,
        hashtagBirthRate: 200,
        baselineBirthRate7d: 20,
        botFraction: 0,
        shillFraction: 0,
        coordinatedFraction: 0,
      },
    }));
    const result = computePulseScore(inputs, {
      prevScore: 65,
      topics: [
        { slug: "big-moment", label: "Big Moment", platforms: ["x", "tiktok", "reddit", "youtube"] },
      ],
    });
    assert.ok(result.pulseScore! >= 70);
    assert.ok(result.event !== null);
  });
});
