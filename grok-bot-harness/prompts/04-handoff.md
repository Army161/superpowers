# Prompt 4 — the handoff file

**Paste into:** every bot. **Build step:** 2 (with its contract).

```xml
every task you finish ends with /workspace/handoffs/[task].md in this exact shape:

TASK: [what you were asked]
STATUS: complete / partial / blocked
OUTPUT: [path to the deliverable]
SOURCES: [links, files, timestamps, screenshots]
NEXT OWNER: [bot name]
DECISIONS: [what you chose and why]
UNCERTAINTIES: [what you're unsure of]
DO-NOT-ASSUME: [what the next bot must re-check]

no handoff file means the task isn't done.
```
