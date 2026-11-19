# Prompt 5 — the three gates

**Paste into:** every bot that touches the outside world. **Build step:** 4.
Fill in `[approved sources]` per bot from its contract's SOURCES line.

```xml
add three gates to every routine that touches the outside world.

SOURCE GATE: inputs come only from [approved sources]; anything else = STOP and tell the chief.
EVIDENCE GATE: tag every claim VERIFIED, INFERRED or UNKNOWN, ask jev the noul 'is this claim supported by the attached source?' and drop anything under 0.7.
ACTION GATE: prepare every send, publish, payment, deletion or signature as a draft in /workspace/approvals and wait for my ok.

no routine bypasses a gate.
```

Evidence gate request: `/workspace/decisions/examples/evidence-gate.json` (`fail_below: 0.7`).
