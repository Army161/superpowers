"""Tests for workspace/tools/jev.py. Run: python3 -m unittest discover grok-bot-harness/tests"""

import json
import os
import sys
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / "workspace" / "tools"))
import jev  # noqa: E402

EXAMPLES = HERE.parent / "workspace" / "decisions" / "examples"


def ex(name):
    return json.loads((EXAMPLES / f"{name}.json").read_text())


class LoadRequest(unittest.TestCase):
    def test_all_examples_load(self):
        for p in EXAMPLES.glob("*.json"):
            jev.load_request(p)

    def test_oversized_state_is_refused(self):
        with tempfile.TemporaryDirectory() as d:
            p = Path(d) / "big.json"
            p.write_text(json.dumps({"state": "x" * 9000, "questions": {"q": {"type": "noul", "instructions": "?"}}}))
            with self.assertRaisesRegex(jev.RequestError, "trim it"):
                jev.load_request(p)

    def test_bad_type_is_refused(self):
        with tempfile.TemporaryDirectory() as d:
            p = Path(d) / "bad.json"
            p.write_text(json.dumps({"state": "s", "questions": {"q": {"type": "prose"}}}))
            with self.assertRaises(jev.RequestError):
                jev.load_request(p)


class BuildQuestions(unittest.TestCase):
    def test_builds_real_sdk_objects(self):
        from typesafe_sdk import Choice, Noul, Score

        qs = jev.build_questions(ex("inbox-triage"))
        self.assertIsInstance(qs["team"], Choice)
        self.assertIsInstance(qs["urgency"], Score)
        self.assertIsInstance(qs["human_first"], Noul)
        # 1-5 levels become a 5-item rubric (jev scores from 0)
        self.assertEqual(len(qs["urgency"].criteria), 5)
        self.assertEqual(qs["urgency"].criteria[0], "Can wait a week")
        # harness-only keys never reach the API
        self.assertNotIn("park_above", qs["human_first"].model_dump())


def choice(label, conf, probs=None):
    return SimpleNamespace(choice=label, confidence=conf, probabilities=probs or {label: conf})


def score(expected0, probs0, conf=0.9):
    return SimpleNamespace(score=expected0, confidence=conf, probabilities=probs0)


def noul(p):
    return SimpleNamespace(noul=p)


class Policy(unittest.TestCase):
    def act(self, name, raw):
        req = ex(name)
        return jev.decide(req, jev.normalise(req, raw))

    def test_cheap_and_safe_proceeds(self):
        action, _ = self.act("which-model", {"tier": choice("cheap", 0.86), "destructive": noul(0.07)})
        self.assertEqual(action, "proceed")

    def test_destructive_parks(self):
        action, reasons = self.act("which-model", {"tier": choice("cheap", 0.9), "destructive": noul(0.51)})
        self.assertEqual(action, "park_for_approval")
        self.assertIn("destructive", reasons[0])

    def test_low_confidence_asks_chief(self):
        action, _ = self.act("which-model", {"tier": choice("cheap", 0.74), "destructive": noul(0.0)})
        self.assertEqual(action, "ask_chief")

    def test_ask_label_asks_chief(self):
        action, _ = self.act("which-model", {"tier": choice("ask", 0.95), "destructive": noul(0.0)})
        self.assertEqual(action, "ask_chief")

    def test_park_beats_ask(self):
        action, _ = self.act("which-model", {"tier": choice("ask", 0.5), "destructive": noul(0.9)})
        self.assertEqual(action, "park_for_approval")

    def test_inbox_urgency_4_goes_to_approvals(self):
        # rubric index 3 == level 4
        raw = {"team": choice("billing", 0.9), "urgency": score(3.0, {"3": 0.7, "2": 0.3}), "human_first": noul(0.1)}
        action, _ = self.act("inbox-triage", raw)
        self.assertEqual(action, "park_for_approval")

    def test_inbox_low_urgency_low_human_first_proceeds(self):
        raw = {"team": choice("support", 0.9), "urgency": score(1.0, {"1": 0.8, "0": 0.2}), "human_first": noul(0.12)}
        action, _ = self.act("inbox-triage", raw)
        self.assertEqual(action, "proceed")
        n = jev.normalise(ex("inbox-triage"), raw)
        self.assertEqual(n["urgency"]["level"], 2)  # index 1 -> level 2, as in Fig. 6
        self.assertEqual(n["urgency"]["expected"], 2.0)

    def test_inbox_human_first_threshold_is_0_3(self):
        raw = {"team": choice("support", 0.9), "urgency": score(0.0, {"0": 1.0}), "human_first": noul(0.31)}
        self.assertEqual(self.act("inbox-triage", raw)[0], "park_for_approval")

    def test_draft_under_4_goes_back(self):
        raw = {
            "clarity": score(3.0, {"3": 0.52, "4": 0.23, "2": 0.18}),  # level 4: passes
            "evidence": score(2.0, {"2": 0.6}),  # level 3: fails
            "hook": score(3.0, {"3": 0.9}),
        }
        action, reasons = self.act("draft-quality", raw)
        self.assertEqual(action, "rework")
        self.assertEqual(len(reasons), 1)
        self.assertIn("evidence", reasons[0])

    def test_evidence_under_0_7_dropped(self):
        self.assertEqual(self.act("evidence-gate", {"supported": noul(0.69)})[0], "rework")
        self.assertEqual(self.act("evidence-gate", {"supported": noul(0.7)})[0], "proceed")

    def test_merge_threshold_0_3(self):
        self.assertEqual(self.act("merge-check", {"overwrites": noul(0.31)})[0], "park_for_approval")
        self.assertEqual(self.act("merge-check", {"overwrites": noul(0.3)})[0], "proceed")

    def test_shell_threshold_0_2(self):
        self.assertEqual(self.act("shell-command", {"risky": noul(0.21)})[0], "park_for_approval")


class RunWithoutNetwork(unittest.TestCase):
    def test_missing_key_asks_chief_and_logs_once(self):
        with tempfile.TemporaryDirectory() as d:
            p = Path(d) / "which-model.json"
            p.write_text((EXAMPLES / "which-model.json").read_text())
            env = {k: v for k, v in os.environ.items() if k != "TYPESAFE_API_KEY"}
            old = os.environ.copy()
            os.environ.clear()
            os.environ.update(env)
            try:
                rc = jev.main(["jev.py", str(p)])
            finally:
                os.environ.clear()
                os.environ.update(old)
            self.assertEqual(rc, 1)
            out = json.loads((Path(d) / "which-model.answers.json").read_text())
            self.assertEqual(out["action"], "ask_chief")
            log = (Path(d) / "LOG.jsonl").read_text().splitlines()
            self.assertEqual(len(log), 1)


if __name__ == "__main__":
    unittest.main()
