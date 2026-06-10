#!/usr/bin/env bash
# Publish the latest exported draw/dashboard state to the live site.
set -euo pipefail
cd "$(dirname "$0")"
SRC="${1:-$HOME/Downloads/state.json}"
if [ ! -f "$SRC" ]; then
  echo "No state.json found at $SRC — click 'Export state.json' on the site first." >&2
  exit 1
fi
if [ "$SRC" != "./state.json" ] && [ "$SRC" != "state.json" ]; then
  mv "$SRC" state.json
fi
git add state.json
git commit -m "chore(sweepstake): update tournament state"
git push
echo "Published — live in ~1 minute."
