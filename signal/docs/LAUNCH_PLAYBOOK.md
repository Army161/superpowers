# $SIGNAL 90-Day Launch Playbook

See the full plan for phase-by-phase execution. This document maps plan phases to repository commands.

## Phase 0 — Stealth (Days -30 to -15)

```bash
npm run stealth:generate
```

- Post generated waveform SVGs from `assets/stealth/generated/posts/`
- Follow [CONTENT_CALENDAR.md](../packages/stealth/CONTENT_CALENDAR.md)
- Use outreach template in `assets/stealth/generated/outreach-template.txt`

## Phase 1 — Cult Without Coin (Days -14 to -1)

```bash
npm run forge:dev        # Signal Forge beta
npm run dashboard:dev    # Live pulse preview
npm run oracle:publish   # Hourly pulse data
```

## Phase 2 — Launch Eve

- Publish [PULSE_METHODOLOGY.md](./PULSE_METHODOLOGY.md)
- Run token dry-run: `npm run token:deploy -- --dry-run`

## Phase 3 — Fair Launch (Day 0)

```bash
SIGNAL_NETWORK=devnet npm run token:deploy -- --revoke-mint
```

- Verify deployment in `data/deployments/`
- Enable dashboard at public URL
- Submit to aggregators with media kit

## Phase 4 — Pulse Ritual (Days 1–30)

```bash
npm run ritual:run -- --demo-grant   # Test grant flow
npm run ritual:run -- --live         # Go-live brief
```

Schedule daily:
```
0 15 * * * cd /path/to/signal && npm run ritual:run
0 16 * * * cd /path/to/signal && npm run ritual:run -- --live
```

See [CREATOR_GRANTS.md](./CREATOR_GRANTS.md) for grant program details.

## Phase 5 — Ceiling Expansion (Days 31–90)

- Wallet widget integration (dashboard API at `/api/pulse/latest`)
- Pulse Seasons NFT album planning
- Branded Pulse API for media partners
