# $SIGNAL — Culture is the Product

The first meme coin whose identity, supply events, and utility are tied to measurable cultural velocity on the internet.

**Ticker:** `$SIGNAL`  
**Network:** Solana  
**Supply:** 7,777,777,777

---

## Project Structure

```
signal/
├── docs/                    # Methodology, tokenomics, launch playbook
├── packages/
│   ├── pulse-core/          # Culture Pulse scoring engine
│   ├── pulse-oracle/        # Hourly on-chain publisher
│   ├── forge/               # Signal Forge — meme card generator
│   ├── dashboard/           # Live Culture Pulse dashboard
│   ├── token/               # Solana SPL token deployment
│   ├── stealth/             # Phase 0 campaign asset generator
│   └── ritual/              # Daily Pulse Check + creator grants
├── assets/                  # Waveform templates, generated stealth posts
└── data/                    # Runtime data (pulse snapshots, grants, deployments)
```

---

## Quick Start

```bash
cd signal
npm install
npm run build

# Compute Culture Pulse score
npm run pulse:compute -- --dry-run

# Publish hourly pulse (oracle)
npm run oracle:publish

# Signal Forge (card generator)
npm run forge:dev

# Live dashboard
npm run dashboard:dev

# Generate stealth campaign assets
npm run stealth:generate

# Daily Pulse Check brief
npm run ritual:run -- --demo-grant

# Token deployment (dry-run)
npm run token:deploy -- --dry-run
```

---

## Key Documents

- [Culture Pulse Methodology](docs/PULSE_METHODOLOGY.md)
- [Tokenomics](docs/TOKENOMICS.md)
- [Creator Grants & Pulse Ritual](docs/CREATOR_GRANTS.md)
- [Stealth Campaign Calendar](packages/stealth/CONTENT_CALENDAR.md)

---

## Launch Checklist

- [ ] Phase 0: 30-day stealth waveform campaign
- [ ] Phase 1: Signal Forge beta + Genesis Signal waitlist
- [ ] Phase 2: Methodology + audit publication
- [ ] Phase 3: Fair launch (70% LP, mint revoked)
- [ ] Phase 4: Daily 4pm UTC Pulse Check ritual
- [ ] Phase 5: Wallet integrations + Pulse Seasons NFTs

---

*We don't pump because someone tweeted a dog. We pump because the internet just had a moment.*
