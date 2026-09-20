# Culture Pulse Methodology

**Version:** 1.0.0  
**Ticker:** `$SIGNAL`  
**Update cadence:** Hourly on-chain publication  
**Score range:** 0–100 (`pulseScore`)

This document is the canonical, public specification for how `$SIGNAL` computes the Culture Pulse index. Third parties are encouraged to mirror and audit this methodology.

---

## 1. Design Principles

1. **Transparency** — Every input signal, weight, and normalization step is documented and reproducible.
2. **Velocity over volume** — We measure *acceleration* of cultural spread, not raw mention counts.
3. **Cross-platform confirmation** — Single-platform spikes are discounted; multi-platform spread is rewarded.
4. **Anti-manipulation** — Bot farms, coordinated hashtag injection, and paid shill bursts are filtered.
5. **Simplicity on-chain** — Only `pulseScore` (0–100) and event metadata are published hourly; full breakdown is available off-chain.

---

## 2. Data Sources

| Platform | Signal type | API / feed | Weight |
|----------|-------------|------------|--------|
| X (Twitter) | Mention acceleration, hashtag birth rate, quote-tweet velocity | X API v2 filtered stream + trends | 35% |
| TikTok | Hashtag view velocity, sound reuse rate | TikTok Research API / third-party trend feed | 25% |
| Reddit | Subreddit emergence, cross-post rate | Reddit API (public subreddit + search) | 20% |
| YouTube Shorts | Short-form upload velocity on trending topics | YouTube Data API v3 | 15% |
| Google Trends | Search interest delta (confirmation layer) | Google Trends API | 5% |

**Ingestion window:** Rolling 6-hour lookback, compared against a 7-day baseline for the same hour-of-day (seasonality adjustment).

---

## 3. Per-Platform Sub-Scores

Each platform produces a normalized sub-score `P_i` ∈ [0, 1].

### 3.1 Mention Acceleration (all text platforms)

```
acceleration = (mentions_last_1h - mentions_prev_1h) / max(mentions_prev_1h, ε)
normalized_accel = sigmoid(acceleration, k=0.5)  // maps to [0, 1]
```

Where `ε = 10` prevents division by zero on cold-start topics.

### 3.2 Hashtag Birth Rate (X, TikTok)

```
birth_rate = new_unique_hashtags_last_1h / max(baseline_birth_rate_7d, 1)
normalized_birth = min(birth_rate / 5.0, 1.0)  // cap at 5× baseline
```

### 3.3 Cross-Platform Spread Bonus

When the same normalized topic (via entity extraction / fuzzy keyword cluster) appears on ≥ 2 platforms within 2 hours:

```
spread_bonus = 0.15 × (platforms_detected - 1)  // max +0.45 for 4+ platforms
```

Applied to the composite before final scaling.

### 3.4 Platform Weights

```
P_composite = Σ (w_i × P_i) + spread_bonus
```

Weights `w_i` from the table in §2, renormalized to sum to 1.0 before spread bonus is applied.

---

## 4. Normalization to pulseScore (0–100)

```
raw = P_composite × 100
pulseScore = round(clamp(raw, 0, 100))
```

### Historical calibration

Scores are calibrated against a reference set of 200 known cultural moments (2020–2025):

| Percentile | Example events | Target pulseScore |
|------------|------------------|-------------------|
| p50 | Routine trending topic | 35–45 |
| p75 | Major celebrity/news moment | 55–70 |
| p90 | Viral meme birth (e.g. Hawk Tuah scale) | 75–85 |
| p99 | Generational internet event | 90–100 |

Calibration constants are stored in `packages/pulse-core/src/calibration.json` and updated quarterly via governance proposal (no discretionary team edits).

---

## 5. Pulse Events (On-Chain Triggers)

When `pulseScore` crosses a threshold **from below** within a 24-hour window:

| Threshold | Event name | Treasury action | NFT drop |
|-----------|------------|-----------------|----------|
| ≥ 70 | `PulseWarm` | Burn 0.01% of culture treasury | — |
| ≥ 85 | `PulseHot` | Burn 0.05% of culture treasury | Moment card mint window opens (24h) |
| ≥ 95 | `PulsePeak` | Burn 0.10% of culture treasury | Premium moment card + UI glitch mode flag |

Threshold crossings are evaluated once per hour at publication time. A score of 84 → 86 in one hour triggers `PulseHot` once; re-trigger requires dropping below 85 and crossing again.

---

## 6. Anti-Manipulation Filters

### 6.1 Bot / coordination detection

- Accounts created < 7 days ago contributing > 30% of mention volume → excluded from acceleration calc.
- Hashtag where > 50% of first-hour posts share identical text (Levenshtein distance < 5) → flagged, excluded.
- Mention burst where > 60% of accounts have mutual follow count < 3 → discounted 80%.

### 6.2 Paid shill detection

- Known shill account lists (community-maintained, governance-updated) → zero weight.
- Sudden coordinated posting from accounts that never previously mentioned the topic → 90% discount for 6 hours.

### 6.3 Self-referential inflation guard

- Mentions of `$SIGNAL`, `$SIGNAL`, `#CulturePulse`, `#SignalPulse` are **excluded** from pulseScore computation to prevent reflexive pumping of the index by the community.

### 6.4 Oracle failure mode

If ≥ 2 data sources are unavailable for > 2 consecutive hours:

- Publish `pulseScore = null` on-chain with `status: DEGRADED`
- No Pulse Events fire during degraded mode
- Public incident log at `docs/incidents/`

---

## 7. On-Chain Publication Format

Published hourly to the Pulse Oracle account (see `packages/pulse-oracle`):

```json
{
  "version": 1,
  "timestamp": "2026-09-20T16:00:00Z",
  "pulseScore": 72,
  "status": "OK",
  "event": "PulseWarm",
  "prevScore": 68,
  "platformBreakdown": {
    "x": 0.78,
    "tiktok": 0.65,
    "reddit": 0.71,
    "youtube": 0.42,
    "googleTrends": 0.55
  },
  "topTopics": ["topic-slug-1", "topic-slug-2", "topic-slug-3"],
  "methodologyVersion": "1.0.0"
}
```

Full breakdown is stored on IPFS/Arweave with hash anchored in the on-chain memo field.

---

## 8. Audit & Governance

- Methodology changes require 7-day public comment period before deployment.
- Third-party mirrors must cite methodology version in their output.
- Quarterly transparency report: false-positive rate on manipulation filters, source uptime, calibration drift.

---

## 9. Reference Implementation

The canonical open-source implementation lives at:

- `packages/pulse-core/` — scoring engine
- `packages/pulse-oracle/` — hourly publisher
- `packages/pulse-core/src/calibration.json` — calibration constants

Run locally:

```bash
cd signal
npm install
npm run pulse:compute -- --dry-run
```

---

*Culture is the product. The score is the proof.*
