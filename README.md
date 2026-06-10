# StackOne World Cup 2026 Sweepstakes

Single-file static site for running and tracking the office World Cup 2026 sweepstake.
Hosted free on GitHub Pages — no backend, no build step.

## How it works

- **Viewers** open the site and see the published draw, prize tracker, leaderboard,
  results log and team board (read-only, loaded from `state.json`).
- **Admin** opens the site with `#admin` on the URL (or `index.html` locally) to run
  the draw, update team stages, log results and set Golden Boot / Glove leaders.
  Edits save to that browser's localStorage until published.

## The draw

Enter each person's name once — the draw works out the pulls. Teams are ordered by
the FIFA World Ranking (April 2026, the final pre-tournament release) and split into
seeded pots: Pot 1 holds one top team per player, Pot 2 the next band, and so on.
Everyone draws one team randomly **within** each pot, so nobody can land both top
seeds. If 48 doesn't divide evenly, the leftover bottom-band teams are extra pulls
handed to randomly-chosen people inside the same seeded draw. Draws are
deterministic per draw ID, so any draw can be reproduced for the doubters.

## Results

Match results pull automatically from ESPN's open World Cup scoreboard feed in
the browser (keyless, CORS-enabled) — refreshed on load and every 5 minutes.
No manual result entry. Team eliminations / champion / runner-up are one-click
updates on the team board.

## Publishing updates

Click **Publish update** on the admin page. Three paths, tried in order:

1. **From any device (recommended):** click **GitHub token** once per browser
   and paste a fine-grained token (repository access: only this repo;
   permissions: Contents read/write). Publish then commits `state.json`
   directly via the GitHub API — nothing local needed, works from a phone.
2. **On the Mac with the repo:** without a token, the page saves `state.json`
   into the repo folder (File System Access API — pick the file once) and the
   launchd watcher (`com.cameroncarlin.sweepstake-autopublish`) commits and
   pushes it.
3. **Anywhere else:** the button downloads `state.json`; publish it with
   `./publish.sh ~/Downloads/state.json`.

GitHub Pages redeploys in about a minute either way, and every update is a
public commit, so it's all above board.
