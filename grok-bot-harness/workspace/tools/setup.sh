#!/usr/bin/env bash
# Run once on the bots' shared cloud computer: bash /workspace/tools/setup.sh
set -euo pipefail
WS="${WORKSPACE:-/workspace}"
for d in tasks research drafts evidence approvals approved handoffs decisions templates tools; do
  mkdir -p "$WS/$d"
done
[ -f "$WS/ACTION_LOG.md" ] || printf '# ACTION_LOG\n\n---\n' > "$WS/ACTION_LOG.md"
python3 -m pip install --quiet -r "$WS/tools/requirements.txt"
if [ -z "${TYPESAFE_API_KEY:-}" ]; then
  echo "WARNING: TYPESAFE_API_KEY is not set. jev.py will answer every request with ask_chief until it is."
fi
echo "workspace ready at $WS"
