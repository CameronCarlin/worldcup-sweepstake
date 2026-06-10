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

## Publishing updates

After editing (draw, results, eliminations) click **Export state.json**, then:

```sh
./publish.sh                       # uses ~/Downloads/state.json
./publish.sh path/to/state.json    # or an explicit path
```

That commits `state.json` and pushes — GitHub Pages redeploys in about a minute,
and every update is a public commit, so it's all above board.
