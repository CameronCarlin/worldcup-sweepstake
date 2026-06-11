# StackOne World Cup 2026 Sweepstake (personal project, no ticket)

Tournament: 2026-06-11 → 2026-07-19. **Real draw published 2026-06-11: ID 589759**, 16 players × 3 teams each (Tom, Cameron, Will, Bryce, Charlie, Guillaume, Gordon, Yasmin, Max, Romain, Elena, Alex, Omar, Andres, Joe, Hisku). Pot £80 = 16 × £5 → prizes £40/£16/£10/£8/£6 (winner/runner-up/boot/spoon/glove).

## Where everything is
- Code: `~/Projects/worldcup-sweepstake/` — `index.html` (main), `tv.html` (office TV), shared `logic.js` (TEAMS data, draw, scoring, ESPN feed mapping — BOTH pages load it; edit logic there, never duplicate), `publish.sh`, `state.json` (the published draw+dashboard truth), README.
- GitHub: `CameronCarlin/worldcup-sweepstake` (public — must stay public for free Pages; a private→public flip DISABLES Pages config, re-enable via `gh api -X POST repos/.../pages -f "source[branch]=main" -f "source[path]=/"`).
- Live: https://cameroncarlin.github.io/worldcup-sweepstake/ (viewers, read-only) · `#admin` = edit mode · `tv.html` = 16:9 no-scroll office view, 4 rotating slides @14s (leaderboard/money/results+fixtures/wall chart), `?slide=N` pins one · `?demo`/`#demo` = sample-names draw show, never saves, auto-disables once published state exists.

## Architecture / model
- Static site, no backend. Published truth = `state.json` in repo (shape: `{names[], rosterText, seed, dash:{stages{name:{stage,out}}, bootTeam, gloveTeam, spoonOverride}, updatedAt}`). Viewers load it read-only and poll it every 3 min (TV-tab freshness); admin works from localStorage (`wc2026-sweepstake-v4`) and publishes.
- Entry model Cameron settled on after two corrections: names listed ONCE; the draw computes pulls (floor(48/N) each + 48%N random extra pulls from bottom band, chosen inside the seeded RNG). Pot = £5 × people, NOT per team.
- Draw fairness: FIFA Apr-2026 ranking → pots (one team per pot per player), random within pot, deterministic per draw ID (`runDraw(names, seed)` in logic.js). Slot-machine draw show is pure theatre over the precomputed result; reel sequence seeded too so "Replay the draw" is identical; click-paced; confetti on land.
- Publish paths (in order): (1) PAT in browser localStorage → "Publish update" PUTs state.json via GitHub Contents API (CORS ok) — **this is how the real draw went up; Cameron's PAT lives in his admin browser**; (2) FS Access API saves into repo → launchd watcher `com.cameroncarlin.sweepstake-autopublish` (WatchPaths on repo state.json, log `~/Documents/StackOne/sweepstake-autopublish/publish.log`) commits+pushes; (3) download + `./publish.sh <path>`. NEVER watch ~/Downloads from launchd — TCC blocks it.
- Auto-tracking (ESPN scoreboard, keyless, CORS `*`): `site.api.espn.com/.../soccer/fifa.world/scoreboard?dates=20260611-20260719&limit=300`. Results log + fixtures fully automatic (5-min refresh, localStorage cache `wc2026-results-cache-v2`). **Golden Boot** = top scorer from per-match `details` goal events (own goals excluded). **Golden Glove** = proxy: most clean sheets, tie fewest conceded. **Wooden Spoon** = worst group-stage team (pts→GD→GF, FIFA-rank tie-break), provisional until all 72 group games post; group/knockout separated by date cutoff `2026-06-28T08:00Z`. All three have admin override dropdowns (override = the `dash.bootTeam/gloveTeam/spoonOverride` fields). Feed names mapped via `TEAM_LOOKUP` aliases (USA, Turkey, Korea Republic, Côte d'Ivoire, Cabo Verde, Congo DR, Bosnia…).
- Manual-only bits: team board stages (eliminations, Champions/Runner-up — setting WIN/RU auto-demotes previous holder) — Cameron updates via `#admin` then Publish update.

## Runbook / gotchas (hard-won)
- Tests: extract logic via `fs.readFileSync("logic.js")` + `eval(logic + tests)` in node (pattern used throughout; `const` doesn't escape eval — concatenate, don't eval separately). Always also: parse every inline `<script>` with `new Function`, and verify every `$("id")` literal exists in markup (python regex check).
- **Verify visually with headless Chrome screenshots** — `"/Applications/Google Chrome.app/.../Google Chrome" --headless=new --window-size=1920,1080 --virtual-time-budget=9000 --screenshot=… URL` then Read the PNG. DOM-text checks once missed the page being fully covered by an overlay (the `[hidden]` vs `display:flex` CSS bug — global fix `[hidden]{display:none!important}` now in both pages).
- macOS `open` strips query strings (and sometimes works oddly with fragments) on `file://` URLs — use localhost or the live URL for anything with params.
- Local preview server used during dev: `python3 -m http.server 8123 --directory ~/Projects/worldcup-sweepstake` (killed at session end; restart if needed).
- Deploy = git push, live ~60s; verify with `curl | grep` for a new string, never assume.
- Commits: `feat(sweepstake): …` area scope (explicitly no ticket).

## Open items / risks
- **Golden Boot scorer extraction is built against ESPN qualifier data shape — unverified on WC2026 events until the first match completes (opener: Mexico v South Africa, 11 Jun ~20:00 ET). Check `topScorer(latestMatches)` picks up scorers after it; patch mapping if shape differs.**
- Shootout penalties in knockouts might appear as "Penalty - Scored" details and over-count the Boot — review when R32 starts (28 Jun).
- ESPN `season.slug` may flip season-wide in knockouts; spoon logic deliberately uses the date cutoff, not the slug.
- If entries ever become paid-multiples again (announcement originally allowed buying extra entries), the older weighted-pot model exists in git history (commit 553d6d8).
