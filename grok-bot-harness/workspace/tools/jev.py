#!/usr/bin/env python3
"""Run one jev decision request and apply the harness thresholds.

Usage:
    python3 /workspace/tools/jev.py /workspace/decisions/<step>.json

Reads the request, asks jev (TypeSafe AI's System One model) the typed questions,
writes /workspace/decisions/<step>.answers.json next to the request, and appends
one line to /workspace/decisions/LOG.jsonl for the Friday audit (prompt 10).

The policy lives here, in code, not in the model. The bot reads "action" from the
answers file and does exactly that:

    proceed            all checks passed
    rework             a score or check came in under its bar (prompt 8)
    ask_chief          low choice confidence, an "ask" label, or jev failed
    park_for_approval  a risk noul went over its threshold (prompts 3, 5, 6, 9)

Request format (see /workspace/decisions/examples/):

    {
      "step": "short name",
      "state": "only the facts that matter (text or JSON, under ~2,000 tokens)",
      "questions": {
        "tier": {"type": "choice", "instructions": "...",
                 "criteria": {"cheap": "...", "frontier": "...", "ask": "..."},
                 "escalate_on": ["ask"], "min_confidence": 0.75},
        "clarity": {"type": "score", "instructions": "...",
                    "levels": {"1": "...", "2": "...", "3": "...", "4": "...", "5": "..."},
                    "min": 4},
        "destructive": {"type": "noul", "instructions": "...", "kind": "risk", "park_above": 0.5},
        "supported": {"type": "noul", "instructions": "...", "kind": "check", "fail_below": 0.7}
      }
    }

Needs: pip install typesafe-sdk, and TYPESAFE_API_KEY in the environment.
"""

from __future__ import annotations

import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

MODEL = os.environ.get("TYPESAFE_DEFAULT_MODEL", "jev-1.13.0")
PRICE_IN_PER_M = 0.042  # USD per 1M input tokens; output is free (list price, Nov 2026)
MAX_STATE_CHARS = 8000  # ~2,000 tokens: "state = only the facts that matter"

# Defaults from prompt 3. A question can override them.
DEFAULT_RISK_PARK_ABOVE = 0.5
DEFAULT_CHECK_FAIL_BELOW = 0.5
DEFAULT_MIN_CONFIDENCE = 0.75

ACTION_RANK = {"proceed": 0, "rework": 1, "ask_chief": 2, "park_for_approval": 3}


class RequestError(ValueError):
    """The request file is malformed; the bot must fix it, not retry."""


# --------------------------------------------------------------------------- request


def load_request(path: Path) -> dict[str, Any]:
    try:
        req = json.loads(path.read_text())
    except json.JSONDecodeError as e:
        raise RequestError(f"not valid JSON: {e}") from e
    if not isinstance(req, dict):
        raise RequestError("request must be a JSON object")
    if "state" not in req:
        raise RequestError("missing 'state'")
    questions = req.get("questions")
    if not isinstance(questions, dict) or not questions:
        raise RequestError("'questions' must be a non-empty object")
    state_text = req["state"] if isinstance(req["state"], str) else json.dumps(req["state"])
    if len(state_text) > MAX_STATE_CHARS:
        raise RequestError(
            f"state is {len(state_text)} chars (~{len(state_text) // 4} tokens); "
            f"trim it to the facts that matter, under {MAX_STATE_CHARS} chars"
        )
    for name, q in questions.items():
        if not isinstance(q, dict) or q.get("type") not in {"choice", "score", "noul"}:
            raise RequestError(f"question '{name}' needs type choice, score or noul")
        if q["type"] == "choice" and not q.get("criteria"):
            raise RequestError(f"choice '{name}' needs criteria")
        if q["type"] == "score" and not (q.get("levels") or q.get("criteria")):
            raise RequestError(f"score '{name}' needs levels")
        if q["type"] == "noul" and q.get("kind", "risk") not in {"risk", "check"}:
            raise RequestError(f"noul '{name}' kind must be 'risk' or 'check'")
    return req


def score_levels(q: dict[str, Any]) -> list[tuple[int, str]]:
    """Return [(level, description)] sorted by level.

    jev scores a rubric from 0. The prompts talk in 1-5, so we keep the user's level
    numbers and translate: rubric index i  <->  levels[i].
    """
    if "levels" in q:
        try:
            pairs = sorted((int(k), v) for k, v in q["levels"].items())
        except ValueError as e:
            raise RequestError("score levels must be keyed by integers, e.g. '1'..'5'") from e
        return pairs
    return list(enumerate(q["criteria"]))


def build_questions(req: dict[str, Any]) -> dict[str, Any]:
    from typesafe_sdk import Choice, Noul, Score

    out: dict[str, Any] = {}
    for name, q in req["questions"].items():
        instructions = q.get("instructions")
        if q["type"] == "choice":
            out[name] = Choice(instructions=instructions, criteria=q["criteria"])
        elif q["type"] == "score":
            out[name] = Score(instructions=instructions, criteria=[d for _, d in score_levels(q)])
        else:
            kwargs: dict[str, Any] = {"instructions": instructions}
            if q.get("criteria"):
                kwargs["criteria"] = q["criteria"]
            out[name] = Noul(**kwargs)
    return out


# --------------------------------------------------------------------------- policy


def normalise(req: dict[str, Any], raw: dict[str, Any]) -> dict[str, dict[str, Any]]:
    """Turn SDK answer objects into plain numbers, with scores on the user's scale."""
    out: dict[str, dict[str, Any]] = {}
    for name, q in req["questions"].items():
        a = raw[name]
        if q["type"] == "choice":
            out[name] = {
                "type": "choice",
                "choice": a.choice,
                "confidence": round(a.confidence, 4),
                "probabilities": {k: round(v, 4) for k, v in a.probabilities.items()},
            }
        elif q["type"] == "score":
            levels = [lvl for lvl, _ in score_levels(q)]
            probs = {levels[int(i)]: round(p, 4) for i, p in a.probabilities.items()}
            top = max(probs, key=probs.get)
            # expected score: map the 0-based expectation back onto the user's levels
            lo, step = levels[0], (levels[1] - levels[0]) if len(levels) > 1 else 1
            out[name] = {
                "type": "score",
                "level": top,
                "expected": round(lo + a.score * step, 3),
                "confidence": round(a.confidence, 4),
                "probabilities": probs,
            }
        else:
            out[name] = {"type": "noul", "noul": round(a.noul, 4)}
    return out


def decide(req: dict[str, Any], answers: dict[str, dict[str, Any]]) -> tuple[str, list[str]]:
    """Apply thresholds. Returns (action, reasons). Most severe action wins."""
    action, reasons = "proceed", []

    def bump(new: str, why: str) -> None:
        nonlocal action
        reasons.append(f"{new}: {why}")
        if ACTION_RANK[new] > ACTION_RANK[action]:
            action = new

    for name, q in req["questions"].items():
        a = answers[name]
        if q["type"] == "choice":
            min_conf = q.get("min_confidence", DEFAULT_MIN_CONFIDENCE)
            if a["choice"] in q.get("escalate_on", []):
                bump("ask_chief", f"{name} = {a['choice']}")
            if a["confidence"] < min_conf:
                bump("ask_chief", f"{name} confidence {a['confidence']} < {min_conf}")
        elif q["type"] == "score":
            if "min" in q and a["level"] < q["min"]:
                bump("rework", f"{name} level {a['level']} < {q['min']}")
            if "park_at_or_above" in q and a["level"] >= q["park_at_or_above"]:
                bump("park_for_approval", f"{name} level {a['level']} >= {q['park_at_or_above']}")
        else:
            if q.get("kind", "risk") == "risk":
                limit = q.get("park_above", DEFAULT_RISK_PARK_ABOVE)
                if a["noul"] > limit:
                    bump("park_for_approval", f"{name} noul {a['noul']} > {limit}")
            else:
                limit = q.get("fail_below", DEFAULT_CHECK_FAIL_BELOW)
                if a["noul"] < limit:
                    bump(q.get("on_fail", "rework"), f"{name} noul {a['noul']} < {limit}")
    return action, reasons


# --------------------------------------------------------------------------- io


def answers_path(req_path: Path) -> Path:
    return req_path.with_name(req_path.stem + ".answers.json")


def write_result(req_path: Path, result: dict[str, Any]) -> None:
    answers_path(req_path).write_text(json.dumps(result, indent=2) + "\n")
    log_line = {
        k: result.get(k)
        for k in ("ts", "step", "request", "action", "reasons", "model", "input_tokens", "est_cost_usd", "error")
    }
    log_line["confidences"] = {
        n: a.get("confidence", a.get("noul")) for n, a in result.get("answers", {}).items()
    }
    with (req_path.parent / "LOG.jsonl").open("a") as f:
        f.write(json.dumps(log_line) + "\n")


def run(req_path: Path) -> dict[str, Any]:
    base = {
        "ts": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "request": str(req_path),
        "step": req_path.stem,
    }
    try:
        req = load_request(req_path)
    except (OSError, RequestError) as e:
        # Malformed request: never retry, send it to the chief.
        return {**base, "action": "ask_chief", "reasons": [f"bad request: {e}"], "error": str(e)}
    base["step"] = req.get("step", base["step"])

    try:
        from typesafe_sdk import TypeSafeClient, TypeSafeError
    except ImportError:
        msg = "typesafe-sdk not installed: pip install typesafe-sdk"
        return {**base, "action": "ask_chief", "reasons": [msg], "error": msg}

    try:
        with TypeSafeClient(model=MODEL) as client:
            r = client.system_one(state=req["state"], questions=build_questions(req))
    except TypeSafeError as e:
        # The SDK retries transient errors up to 2 times (its default RetryPolicy). We never loop beyond that.
        msg = f"{type(e).__name__}: {e}"
        return {**base, "action": "ask_chief", "reasons": [f"jev failed: {msg}"], "error": msg}

    answers = normalise(req, r.answers)
    action, reasons = decide(req, answers)
    tokens = r.usage.input_tokens
    return {
        **base,
        "action": action,
        "reasons": reasons,
        "answers": answers,
        "model": r.model,
        "input_tokens": tokens,
        "est_cost_usd": round((tokens or 0) * PRICE_IN_PER_M / 1_000_000, 8),
    }


def main(argv: list[str]) -> int:
    if len(argv) != 2:
        print(__doc__, file=sys.stderr)
        return 2
    req_path = Path(argv[1])
    result = run(req_path)
    write_result(req_path, result)
    print(json.dumps({k: result[k] for k in ("action", "reasons")} | {"answers_file": str(answers_path(req_path))}, indent=2))
    return 0 if "error" not in result else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
