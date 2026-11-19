# Prompt 7 — inbox triage routine (Example 1, the best first swarm)

**Paste into:** the support bot, as an hourly routine. **Build step:** 6 (bot #2).
Fill in `[inbox]` (for example your Gmail address) and `[support bot]` (`support`).

```xml
routine, every hour: pull unread mail from [inbox].

for each message build a jev request.
state = sender, subject, first 800 characters, number of past messages in the thread.
questions:
- team (choice: sales / support / billing / spam)
- urgency (score 1-5)
- human_first (noul: 'does a person need to see this before any reply?')

route:
- spam = archive
- human_first > 0.3 or urgency ≥ 4 = /workspace/approvals with a draft
- everything else = hand to [support bot] to draft and queue

stay silent unless something lands in approvals.
```

jev request: `/workspace/decisions/examples/inbox-triage.json`. `jev.py` returns `park_for_approval` when human_first > 0.3 or urgency ≥ 4. The bot checks `team == spam` itself. The chief sends you one summary at 9:00 and 17:00.
