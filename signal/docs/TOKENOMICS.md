# $SIGNAL Tokenomics

**Token:** Signal  
**Ticker:** `$SIGNAL`  
**Network:** Solana (SPL Token)  
**Decimals:** 9  
**Total supply:** 7,777,777,777  

---

## Allocation

| Bucket | % | Tokens | Notes |
|--------|---|--------|-------|
| Liquidity | 70% | 5,444,444,444 | Raydium pool; LP locked 5+ years |
| Community airdrop | 15% | 1,166,666,666 | Genesis Signal waitlist participants |
| Culture treasury | 10% | 777,777,777 | Pulse Events, grants, IRL stunts |
| Core contributors | 5% | 388,888,888 | 2-year linear vest |

---

## Launch Parameters

- **Mint authority:** Revoked at launch (see `token:deploy --revoke-mint`)
- **Freeze authority:** None
- **Transfer fee:** 0% (no buy/sell tax)
- **LP lock:** 5 years minimum via Streamflow or equivalent

---

## Culture Treasury

Multisig: 3-of-5 (public wallet labels in `packages/token/wallets.json`)

Uses:
- Pulse Event micro-burns (0.01% / 0.05% / 0.10% per threshold crossing)
- Daily creator grants (1 SOL + feature spot)
- IRL billboard / stunt budget
- Forge premium revenue (optional 1% on white-label exports → treasury)

---

## Conviction Weight

Governance weight formula (off-chain index, on-chain snapshot for proposals):

```
weight = sqrt(balance) × min(days_held / 30, 1.0) × participation_multiplier
```

`participation_multiplier`:
- 1.0 if Signal Proof completed (Forge card + moment NFT mint)
- 0.25 otherwise

---

## Public Wallets

See [`packages/token/wallets.json`](../packages/token/wallets.json) for labeled devnet/mainnet addresses after deployment.
