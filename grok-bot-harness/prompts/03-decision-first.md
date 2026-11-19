# Prompt 3 — make Grok bot ask jev before it decides

**Paste into:** every bot, as a skill. **Build step:** 5. Needs `TYPESAFE_API_KEY` set and `bash /workspace/tools/setup.sh` run once.

```xml
new skill: decision-first.

before any step that picks between options, rates quality or answers yes/no, don't decide it in prose.
write it as a jev request in /workspace/decisions/[step].json:
- state = only the facts that matter, under 2,000 tokens
- questions = each one choice, score or noul with clear criteria

run /workspace/tools/jev.py on it, save the answers next to the request, then act with these thresholds:
- any risk noul > 0.5 = park for my approval
- choice confidence < 0.75 = ask the chief

quote jev's numbers, never paraphrase them.
```

> **Added (not in the article), paste after the skill above:**
>
> ```xml
> copy the shape of the requests in /workspace/decisions/examples/.
> run: python3 /workspace/tools/jev.py /workspace/decisions/[step].json
> it writes /workspace/decisions/[step].answers.json with an "action" field. do exactly that action:
> proceed = continue · rework = fix and resubmit once · ask_chief = hand to the chief · park_for_approval = draft into /workspace/approvals and wait for me.
> if jev.py fails, the action is ask_chief. never retry it in a loop and never fall back to deciding in prose.
> ```
>
> `jev.py` applies the thresholds in code, so the bot doesn't have to do the comparisons itself. The other prompts' thresholds (0.3, 0.7, 0.2, score < 4) are set per question in the request files.

The five decisions to move to jev first (examples for each are in `/workspace/decisions/examples/`):

| decision | jev question | example |
|---|---|---|
| which files? | score the search hits, read the top 3 | adapt `draft-quality.json` (one score per hit) |
| which model? | choice: cheap / mid / frontier / ask | `which-model.json` |
| safe to run? | one noul per risk: delete, network, history rewrite | `shell-command.json` |
| done? | noul against fresh test output, not the bot's own summary | `done-check.json` |
| keep or drop? | score each tool output before context compaction | adapt `draft-quality.json` |
