# Prompt 10 — the weekly audit

**Paste into:** the chief, as a routine. **Build step:** any time after jev is in.

```xml
every friday at 16:00 read /workspace/ACTION_LOG.md and /workspace/decisions for the week.

report:
- decisions sent to jev vs decided in prose
- average jev confidence per question
- routines that woke up and found nothing
- approvals that waited more than 4 hours
- any bot that wrote outside its folder

suggest one rule to tighten and one bot to retire.
change nothing without my ok.
```

> **Added (not in the article):** `jev.py` appends one line per decision to `/workspace/decisions/LOG.jsonl` (step, action, reasons, confidences, input tokens, estimated cost). Tell the chief to read that file for the jev counts and average confidence.
