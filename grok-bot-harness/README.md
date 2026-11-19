# Grok bot harness

The setup from "Your Grok Bot Is Burning Money — Harness Fixes It", built out as files: the 10 prompts, a contract for each bot, the `/workspace` layout, and a working `jev.py` decision tool.

**Grok writes · jev decides · the harness enforces · the swarm scales.**

```
prompts/      the 10 prompts, word for word (my additions are marked "Added")
contracts/    prompt 2 filled in for support, research, writer, merge, tech-lead
workspace/    copy this to /workspace on the bots' shared cloud computer
  tools/jev.py          runs a decision request through jev and applies the thresholds
  tools/setup.sh        creates the folders and installs typesafe-sdk
  decisions/examples/   one request for each jev decision in the article
  templates/            TASK.md (prompt 1) and HANDOFF.md (prompt 4)
  ACTION_LOG.md         you own it; merge appends to it
tests/        tests for jev.py (17, all passing)
```

## Before you start

1. **Get a TypeSafe API key** at typesafe.ai. Set `TYPESAFE_API_KEY` wherever your bots run commands. Without it, `jev.py` answers every request with `ask_chief` and never decides on its own.
2. **Copy `workspace/` into `/workspace`** on the bots' shared computer, then run `bash /workspace/tools/setup.sh`.
3. Check it works: `python3 /workspace/tools/jev.py /workspace/decisions/examples/which-model.json` should print an `action` (for that example, most likely `proceed`) and write `which-model.answers.json`. If it says `ask_chief` with "No API key", the key isn't set.

## Build order: chief → contracts → /workspace → gates → jev → bot #2

Do these in order. Don't add the next bot until work is waiting for it.

| step | what | paste | into |
|---|---|---|---|
| 1 | **chief** | `prompts/01-chief.md` | your main Grok bot |
| 2 | **contracts** | `contracts/support.md` (fill in `[your inbox]`), then `prompts/04-handoff.md` | the chief, then the new bot |
| 3 | **/workspace** | already done in "Before you start" | — |
| 4 | **gates** | `prompts/05-three-gates.md` (approved sources = the bot's SOURCES line) | every bot that touches the outside world |
| 5 | **jev** | `prompts/03-decision-first.md`, including the "Added" block | every bot |
| 6 | **bot #2 runs** | `prompts/07-inbox-triage.md` (fill in `[inbox]`) | support |
| later | the weekly audit | `prompts/10-weekly-audit.md` | the chief |

After that, grow only by bottleneck:

- **Content engine:** `contracts/research.md` and `contracts/writer.md`, plus `prompts/08-draft-quality-gate.md` for writer.
- **Code swarm:** `prompts/06-merge-agent.md` first (with `contracts/merge.md`), then `contracts/tech-lead.md` and `prompts/09-tech-lead.md` per ticket.

## The checklist (run it every time the swarm grows)

- [ ] 01 the chief exists before any specialist: routes, never executes
- [ ] 02 every bot has a 5-field contract: job · sources · judgment · output · forbidden
- [ ] 03 /workspace has its folders: research · drafts · evidence · approvals · handoffs
- [ ] 04 decisions go to jev, writing goes to grok: choice · score · noul
- [ ] 05 three gates on every external action: source · evidence · action
- [ ] 06 one merge agent and one ACTION_LOG.md, and you own the log
- [ ] 07 silent by default: notify on exception only

## How jev.py enforces the thresholds

The policy stays in code. Each request sets its own thresholds, and `jev.py` returns one action. If several checks fire, the most severe one wins: `park_for_approval` > `ask_chief` > `rework` > `proceed`.

| where | question | rule | action |
|---|---|---|---|
| prompt 3 | any risk noul | > 0.5 | park_for_approval |
| prompt 3 | any choice | confidence < 0.75, or label `ask` | ask_chief |
| prompt 5 | evidence noul | < 0.7 | rework (drop the claim) |
| prompt 6 | overwrites / rewrites history | > 0.3 | park_for_approval |
| prompt 7 | human_first | > 0.3 | park_for_approval |
| prompt 7 | urgency | ≥ 4 | park_for_approval |
| prompt 8 | clarity / evidence / hook | < 4 | rework |
| prompt 9 | delete / network / history | > 0.2 | park_for_approval |

Where this differs from the article:

- **Scores count from 0 in the real SDK.** You write levels 1–5 and `jev.py` translates them both ways.
- **Big state is refused.** If `state` is over about 2,000 tokens (8,000 characters), the request goes back to `ask_chief` with "trim it". This enforces "filter before reading".
- **No retry loops.** The SDK retries a failed call at most twice. After that `jev.py` gives up and returns `ask_chief`.
- **Every decision is logged.** Each one appends a line to `decisions/LOG.jsonl` with step, action, confidences, input tokens and estimated cost. The Friday audit reads this file.

## What's yours to fill in

`[your inbox]`, `[your trusted sites]`, `[your repo]`, `[ticket]`, and the TypeSafe API key. Everything else is filled in from the article.

## Run the tests

```
python3 -m pip install typesafe-sdk
python3 -m unittest discover -s grok-bot-harness/tests -v
```
