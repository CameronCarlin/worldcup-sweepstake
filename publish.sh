#!/usr/bin/env bash
# Commit & push state.json whenever it changes.
# - The launchd watcher invokes this when the admin page saves state.json
#   straight into the repo (File System Access API).
# - Run manually with a path arg for the download fallback:
#   ./publish.sh ~/Downloads/state.json
set -euo pipefail
cd "$(dirname "$0")"
log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }

SRC="${1:-}"
if [ -n "$SRC" ] && [ "$SRC" != "state.json" ] && [ "$SRC" != "./state.json" ]; then
  [ -f "$SRC" ] || { log "No file at $SRC"; exit 1; }
  mv "$SRC" state.json
fi

[ -f state.json ] || exit 0
sleep 1 # let the browser finish writing
git add state.json
if ! git diff --cached --quiet; then
  git commit -q -m "chore(sweepstake): update tournament state"
fi
# push anything pending (also recovers a commit stranded by an earlier failure)
ahead=$(git rev-list --count origin/main..main 2>/dev/null || echo 0)
[ "$ahead" -gt 0 ] || exit 0
git pull --rebase --autostash -q
git push -q
log "Published state update — live in ~1 minute."
