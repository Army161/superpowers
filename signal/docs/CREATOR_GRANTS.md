# Daily Pulse Check & Creator Grant Program

## Pulse Check Ritual

**Schedule:** Daily at 4:00 PM UTC  
**Platform:** X Spaces (primary) + live dashboard sync  
**Duration:** 15–30 minutes

### Ritual Structure

1. **Opening (0:00)** — Live `pulseScore` reveal with waveform animation
2. **Top 3 Moments (0:03)** — Today's cultural accelerations with platform breakdown
3. **Community Cards (0:10)** — Best Signal Forge exports from last 24h
4. **Grant Winner (0:15)** — Announce daily creator grant recipient
5. **Open Pulse (0:20)** — Q&A; no price talk (first 30 days post-launch)

### Announcement Template

```
Pulse Check live in 15 minutes.

Today's score: [pending]
Top topics: [topic1] · [topic2] · [topic3]

Join the ritual. Culture is the product.

$SIGNAL // 4pm UTC
```

---

## Creator Grant Program

**Budget:** 1 SOL + featured spot per day (from culture treasury)  
**Duration:** Days 1–30 post-launch (Phase 4)

### Eligibility

- Submit a Signal Forge card URL or PNG via grant form
- Card must reference a real cultural moment (link required)
- One submission per wallet per day
- Signal Proof completed (Forge card + moment NFT) = priority review

### Selection Criteria

| Criterion | Weight |
|-----------|--------|
| Memetic quality (shareability) | 40% |
| Cultural relevance (timeliness) | 30% |
| Pulse aesthetic alignment | 20% |
| Community vote (Discord/X poll) | 10% |

### Grant Flow

```
Submit → Daily review at 3pm UTC → Winner announced at Pulse Check → SOL sent within 1h
```

### Submission Fields

- Wallet address (Solana)
- Forge card link or image upload
- Source link (tweet/TikTok/Reddit/YouTube)
- Optional: one-line context

### Treasury Controls

- Grants drawn from culture treasury (10% allocation)
- Max 1 SOL/day; unused budget rolls to weekly billboard fund
- All payouts logged publicly in `data/grants/`

---

## IRL Stunt (Day 14–21)

- Digital billboard in NYC (Times Square adj.) or Shibuya crossing
- Display live `pulseScore` from dashboard API
- Film reaction content for X/TikTok
- Budget: ~$5k from culture treasury

---

## Automation

Run the daily ritual prep:

```bash
cd signal
npm run ritual:run
```

Schedule with cron:

```
0 15 * * * cd /path/to/signal && npm run ritual:run   # 3pm UTC prep
0 16 * * * cd /path/to/signal && npm run ritual:run -- --live  # 4pm UTC go-live
```
