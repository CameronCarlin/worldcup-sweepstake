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

Teams are ordered by the FIFA World Ranking (April 2026, the final pre-tournament
release) and split into seeded pots: Pot 1 holds one top team per player, Pot 2 the
next band, and so on. Each entry draws randomly **within** its pot, so equal entry
counts get identical strength profiles and nobody can land both top seeds. Extra
entries draw from the lower pots. Draws are deterministic per draw ID, so any draw
can be reproduced for the doubters.

## Publishing updates

After editing (draw, results, eliminations) click **Export state.json**, then:

```sh
./publish.sh                       # uses ~/Downloads/state.json
./publish.sh path/to/state.json    # or an explicit path
```

That commits `state.json` and pushes — GitHub Pages redeploys in about a minute,
and every update is a public commit, so it's all above board.
