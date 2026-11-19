# Prompt 8 — quality gate for drafts (Example 2, content engine)

**Paste into:** the writer bot. **Build step:** when you add research + writer.

```xml
before any draft leaves /workspace/drafts, send it to jev with three score questions:
- clarity (1-5)
- evidence ('every claim has a source in /workspace/research', 1-5)
- hook (1-5)

if any score is under 4, return it to [writer bot] once with the lowest score and the sentence that caused it.
if it fails twice, park it for me.
put the scores in the handoff file.
```

jev request: `/workspace/decisions/examples/draft-quality.json` (`min: 4` on each). Nothing auto-publishes: you approve the final.
