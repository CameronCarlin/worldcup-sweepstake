// --- Pure draw + scoring logic (no DOM) -------------------------------------
// Seedings: FIFA Men's World Ranking, April 2026 (final pre-tournament release)
const TEAMS = [
  { name: "France",               flag: "🇫🇷", rank: 1,  group: "I" },
  { name: "Spain",                flag: "🇪🇸", rank: 2,  group: "H" },
  { name: "Argentina",            flag: "🇦🇷", rank: 3,  group: "J" },
  { name: "England",              flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", rank: 4,  group: "L" },
  { name: "Portugal",             flag: "🇵🇹", rank: 5,  group: "K" },
  { name: "Brazil",               flag: "🇧🇷", rank: 6,  group: "C" },
  { name: "Netherlands",          flag: "🇳🇱", rank: 7,  group: "F" },
  { name: "Morocco",              flag: "🇲🇦", rank: 8,  group: "C" },
  { name: "Belgium",              flag: "🇧🇪", rank: 9,  group: "G" },
  { name: "Germany",              flag: "🇩🇪", rank: 10, group: "E" },
  { name: "Croatia",              flag: "🇭🇷", rank: 11, group: "L" },
  { name: "Colombia",             flag: "🇨🇴", rank: 13, group: "K" },
  { name: "Senegal",              flag: "🇸🇳", rank: 14, group: "I" },
  { name: "Mexico",               flag: "🇲🇽", rank: 15, group: "A" },
  { name: "United States",        flag: "🇺🇸", rank: 16, group: "D" },
  { name: "Uruguay",              flag: "🇺🇾", rank: 17, group: "H" },
  { name: "Japan",                flag: "🇯🇵", rank: 18, group: "F" },
  { name: "Switzerland",          flag: "🇨🇭", rank: 19, group: "B" },
  { name: "Iran",                 flag: "🇮🇷", rank: 21, group: "G" },
  { name: "Türkiye",              flag: "🇹🇷", rank: 22, group: "D" },
  { name: "Ecuador",              flag: "🇪🇨", rank: 23, group: "E" },
  { name: "Austria",              flag: "🇦🇹", rank: 24, group: "J" },
  { name: "South Korea",          flag: "🇰🇷", rank: 25, group: "A" },
  { name: "Australia",            flag: "🇦🇺", rank: 27, group: "D" },
  { name: "Algeria",              flag: "🇩🇿", rank: 28, group: "J" },
  { name: "Egypt",                flag: "🇪🇬", rank: 29, group: "G" },
  { name: "Canada",               flag: "🇨🇦", rank: 30, group: "B" },
  { name: "Norway",               flag: "🇳🇴", rank: 31, group: "I" },
  { name: "Panama",               flag: "🇵🇦", rank: 33, group: "L" },
  { name: "Ivory Coast",          flag: "🇨🇮", rank: 34, group: "E" },
  { name: "Sweden",               flag: "🇸🇪", rank: 38, group: "F" },
  { name: "Paraguay",             flag: "🇵🇾", rank: 40, group: "D" },
  { name: "Czechia",              flag: "🇨🇿", rank: 41, group: "A" },
  { name: "Scotland",             flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", rank: 43, group: "C" },
  { name: "Tunisia",              flag: "🇹🇳", rank: 44, group: "F" },
  { name: "DR Congo",             flag: "🇨🇩", rank: 46, group: "K" },
  { name: "Uzbekistan",           flag: "🇺🇿", rank: 50, group: "K" },
  { name: "Qatar",                flag: "🇶🇦", rank: 55, group: "B" },
  { name: "Iraq",                 flag: "🇮🇶", rank: 57, group: "I" },
  { name: "South Africa",         flag: "🇿🇦", rank: 60, group: "A" },
  { name: "Saudi Arabia",         flag: "🇸🇦", rank: 61, group: "H" },
  { name: "Jordan",               flag: "🇯🇴", rank: 63, group: "J" },
  { name: "Bosnia & Herzegovina", flag: "🇧🇦", rank: 65, group: "B" },
  { name: "Cape Verde",           flag: "🇨🇻", rank: 69, group: "H" },
  { name: "Ghana",                flag: "🇬🇭", rank: 74, group: "L" },
  { name: "Curaçao",              flag: "🇨🇼", rank: 82, group: "E" },
  { name: "Haiti",                flag: "🇭🇹", rank: 83, group: "C" },
  { name: "New Zealand",          flag: "🇳🇿", rank: 85, group: "G" },
];

const ENTRY_PRICE = 5;
const PRIZES = [
  { key: "winner", ico: "🏆", label: "Winner",       pct: 0.50  },
  { key: "runner", ico: "🥈", label: "Runner-up",    pct: 0.20  },
  { key: "boot",   ico: "👟", label: "Golden Boot",  pct: 0.125 },
  { key: "spoon",  ico: "🥄", label: "Wooden Spoon", pct: 0.10  },
  { key: "glove",  ico: "🧤", label: "Golden Glove", pct: 0.075 },
];

// Deterministic PRNG so a draw can be reproduced (and disputed!) from its ID.
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(arr, rnd) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Tiered draw over a plain list of names. The draw itself works out the
// pulls: with N people, everyone gets floor(48/N) teams — one from each
// seeded pot — and the 48 % N leftover teams (the bottom band) are extra
// pulls handed to randomly-chosen people. All randomness comes from the one
// seeded RNG, so the whole draw is reproducible from its ID.
function runDraw(names, seed) {
  const rnd = mulberry32(seed);
  const sorted = [...TEAMS].sort((a, b) => a.rank - b.rank);
  const N = names.length;
  const base = Math.floor(sorted.length / N);
  const extra = sorted.length % N;

  const luckyIdx = new Set(shuffle(names.map((_, i) => i), rnd).slice(0, extra));
  const players = names.map((name, i) => ({
    name, entries: base + (luckyIdx.has(i) ? 1 : 0), teams: [],
  }));
  const potCount = base + (extra ? 1 : 0);
  let idx = 0;

  for (let pot = 1; pot <= potCount; pot++) {
    const eligible = players.map((p, i) => (p.entries >= pot ? i : -1)).filter(i => i >= 0);
    const band = sorted.slice(idx, idx + eligible.length);
    idx += eligible.length;
    const order = shuffle([...eligible], rnd);
    band.forEach((team, k) => players[order[k]].teams.push({ ...team, pot }));
  }

  players.forEach(pl => pl.teams.sort((a, b) => a.rank - b.rank));
  return { players, potCount, base, extra };
}

// --- tournament stages / scoring ---
const STAGES = [
  { key: "GROUP", label: "Groups",   short: "Grp" },
  { key: "R32",   label: "Rd of 32", short: "R32" },
  { key: "R16",   label: "Rd of 16", short: "R16" },
  { key: "QF",    label: "Quarters", short: "QF" },
  { key: "SF",    label: "Semis",    short: "SF" },
  { key: "RU",    label: "🥈 Runner-up", short: "RU" },
  { key: "WIN",   label: "🏆 Champions", short: "WIN" },
];
const STAGE_ORDER = Object.fromEntries(STAGES.map((s, i) => [s.key, i]));

// --- wooden spoon: the worst team of the group stage --------------------
// Bottom of the combined group-stage table: fewest points, then worst goal
// difference, then fewest goals scored; final tie-break goes against the
// lower FIFA ranking. Built automatically from the live results feed.
const GROUP_STAGE_CUTOFF = Date.parse("2026-06-28T08:00:00Z"); // R32 kicks off later on 28 June

function normTeamName(s) {
  return String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z]/g, "");
}
const TEAM_LOOKUP = (() => {
  const map = {};
  TEAMS.forEach(t => (map[normTeamName(t.name)] = t.name));
  // names the scores feed may use
  Object.entries({
    usa: "United States",
    cotedivoire: "Ivory Coast",
    turkey: "Türkiye",
    caboverde: "Cape Verde",
    iriran: "Iran",
    congodr: "DR Congo",
    democraticrepublicofthecongo: "DR Congo",
    korearepublic: "South Korea",
    bosniaandherzegovina: "Bosnia & Herzegovina",
    czechrepublic: "Czechia",
  }).forEach(([k, v]) => (map[k] = v));
  return map;
})();
function resolveTeam(feedName) {
  const our = TEAM_LOOKUP[normTeamName(feedName)];
  return our ? TEAMS.find(t => t.name === our) : null;
}

function spoonStanding(matches) {
  const gm = (matches || []).filter(m => Date.parse(m.date) < GROUP_STAGE_CUTOFF);
  const rows = {};
  let counted = 0;
  for (const m of gm) {
    if (m.state !== "post") continue;
    const home = resolveTeam(m.home), away = resolveTeam(m.away);
    const hs = parseInt(m.hs, 10), as = parseInt(m.as, 10);
    if (!home || !away || isNaN(hs) || isNaN(as)) continue;
    counted++;
    const r = n => (rows[n] = rows[n] || { pts: 0, gd: 0, gf: 0, played: 0 });
    const h = r(home.name), a = r(away.name);
    h.played++; a.played++;
    h.gf += hs; a.gf += as;
    h.gd += hs - as; a.gd += as - hs;
    if (hs > as) h.pts += 3; else if (hs < as) a.pts += 3; else { h.pts++; a.pts++; }
  }
  if (!counted) return { team: null, complete: false, row: null };
  const complete = gm.length >= 72 && gm.every(m => m.state === "post");
  const ranked = Object.keys(rows)
    .map(name => ({ team: TEAMS.find(t => t.name === name), ...rows[name] }))
    .sort((x, y) => x.pts - y.pts || x.gd - y.gd || x.gf - y.gf || y.team.rank - x.team.rank);
  return { team: ranked[0].team, complete, row: ranked[0] };
}

// Golden Boot: top scorer across the tournament (own goals excluded).
function topScorer(matches) {
  const tally = {};
  for (const m of matches || []) {
    if (m.state === "pre") continue;
    for (const s of m.scorers || []) {
      const team = s.team ? resolveTeam(s.team) : null;
      if (!team) continue;
      const k = s.player + "|" + team.name;
      tally[k] = tally[k] || { player: s.player, team, goals: 0 };
      tally[k].goals++;
    }
  }
  const all = Object.values(tally).sort((a, b) => b.goals - a.goals || a.player.localeCompare(b.player));
  if (!all.length) return null;
  return { ...all[0], joint: all.length > 1 && all[1].goals === all[0].goals };
}

// Golden Glove proxy: most clean sheets, tie-break fewest goals conceded.
function cleanSheetLeader(matches) {
  const rows = {};
  for (const m of matches || []) {
    if (m.state !== "post") continue;
    const home = resolveTeam(m.home), away = resolveTeam(m.away);
    const hs = parseInt(m.hs, 10), as = parseInt(m.as, 10);
    if (!home || !away || isNaN(hs) || isNaN(as)) continue;
    const r = n => (rows[n] = rows[n] || { cs: 0, conceded: 0, played: 0 });
    const h = r(home.name), a = r(away.name);
    h.played++; a.played++;
    h.conceded += as; a.conceded += hs;
    if (as === 0) h.cs++;
    if (hs === 0) a.cs++;
  }
  const all = Object.keys(rows)
    .map(n => ({ team: TEAMS.find(t => t.name === n), ...rows[n] }))
    .sort((x, y) => y.cs - x.cs || x.conceded - y.conceded || x.team.rank - y.team.rank);
  if (!all.length || all[0].cs === 0) return null;
  return { ...all[0], joint: all.length > 1 && all[1].cs === all[0].cs && all[1].conceded === all[0].conceded };
}

// Compute prize holders + per-player winnings from draw + dashboard state.
// The pot is £5 per person in the draw — teams are divided between them.
// `awards` carries the feed-derived (or overridden) boot/glove/spoon holders.
function computeStandings(players, dash, awards) {
  awards = awards || {};
  const pot = players.length * ENTRY_PRICE;
  const prize = Object.fromEntries(PRIZES.map(p => [p.key, pot * p.pct]));

  const ownerOf = {};
  players.forEach(pl => pl.teams.forEach(t => (ownerOf[t.name] = pl.name)));

  const stageOf = name => (dash.stages[name] || { stage: "GROUP", out: false });
  const champion = TEAMS.find(t => stageOf(t.name).stage === "WIN");
  const runnerUp = TEAMS.find(t => stageOf(t.name).stage === "RU");
  const held = a => (a && a.team ? { team: a.team, owner: ownerOf[a.team.name] } : null);

  const holders = {
    winner: champion ? { team: champion, owner: ownerOf[champion.name] } : null,
    runner: runnerUp ? { team: runnerUp, owner: ownerOf[runnerUp.name] } : null,
    boot:   held(awards.boot),
    glove:  held(awards.glove),
    spoon:  held(awards.spoon),
  };

  const rows = players.map(pl => {
    let winnings = 0;
    const wins = [];
    PRIZES.forEach(pz => {
      const h = holders[pz.key];
      if (h && h.owner === pl.name) { winnings += prize[pz.key]; wins.push(pz); }
    });
    const alive = pl.teams.filter(t => !stageOf(t.name).out).length;
    const best = Math.max(...pl.teams.map(t => STAGE_ORDER[stageOf(t.name).stage]));
    return {
      name: pl.name, entries: pl.entries, paid: ENTRY_PRICE,
      teams: pl.teams, alive, total: pl.teams.length,
      best: STAGES[best], winnings, wins,
    };
  });
  rows.sort((a, b) => b.winnings - a.winnings || b.alive - a.alive || a.name.localeCompare(b.name));
  return { pot, prize, holders, rows, ownerOf, stageOf };
}

// --- shared helpers for index.html and tv.html ------------------------------
function teamByName(name) { return TEAMS.find(t => t.name === name) || null; }

const RESULTS_API = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=20260611-20260719&limit=300";

// Map the ESPN scoreboard payload to the internal match shape.
function mapScoreboardEvents(d) {
  return (d.events || []).map(e => {
    const c = e.competitions[0];
    const home = c.competitors.find(x => x.homeAway === "home") || c.competitors[0];
    const away = c.competitors.find(x => x.homeAway === "away") || c.competitors[1];
    const idToTeam = {};
    c.competitors.forEach(x => {
      if (x.id != null) idToTeam[x.id] = x.team.displayName;
      if (x.team && x.team.id != null) idToTeam[x.team.id] = x.team.displayName;
    });
    const scorers = (c.details || [])
      .filter(dt => {
        const t = ((dt.type && dt.type.text) || "").toLowerCase();
        return (t.includes("goal") && !t.includes("own")) || (t.includes("penalty") && t.includes("scored"));
      })
      .map(dt => ({
        player: (dt.athletesInvolved && dt.athletesInvolved[0] && dt.athletesInvolved[0].displayName) || "Unknown",
        team: idToTeam[dt.team && dt.team.id] || null,
      }));
    // knockout matches flag the team that goes through — this already accounts
    // for extra time and penalty shootouts, so we don't have to.
    const adv = c.competitors.find(x => x.advance === true)
      || c.competitors.find(x => x.winner === true) || null;
    const slug = (e.season && e.season.slug) || "";
    return {
      date: e.date,
      id: (c && c.id) || e.id || null,
      round: slug.replace(/-/g, " "),
      roundSlug: slug,
      state: e.status.type.state, // pre | in | post
      detail: e.status.type.shortDetail || "",
      home: home.team.displayName, hs: home.score,
      away: away.team.displayName, as: away.score,
      advance: adv && adv.team ? adv.team.displayName : null,
      scorers,
    };
  });
}

// --- automatic stage tracking from the live feed ----------------------------
// Every match is tagged with its round, and knockout matches flag which team
// advanced — so each team's furthest stage and its elimination fall straight
// out of the feed (shootouts included). Manual dash.stages entries are treated
// as per-team overrides by effectiveDash(), so a human always has the final
// say if the feed is ever wrong.
const FEED_ROUND_STAGE = {
  "round-of-32":   "R32",
  "round-of-16":   "R16",
  "quarterfinals": "QF",
  "semifinals":    "SF",
  "final":         "FINAL",
};

function deriveStages(matches) {
  if (!matches || !matches.length) return {};
  const order = { R32: 1, R16: 2, QF: 3, SF: 4, FINAL: 5 };
  // a winner moves to the next round; the SF winner waits at "final" until it's played
  const nextAfter = { R32: "R16", R16: "QF", QF: "SF", SF: "SF" };

  const rec = {};              // team → furthest knockout appearance
  const groupTeams = new Set();
  let knockoutsExist = false;

  for (const m of matches) {
    if (m.roundSlug === "group-stage") {
      const h = resolveTeam(m.home), a = resolveTeam(m.away);
      if (h) groupTeams.add(h.name);
      if (a) groupTeams.add(a.name);
      continue;
    }
    const stg = FEED_ROUND_STAGE[m.roundSlug];
    if (!stg) continue;                                   // e.g. 3rd-place match — no stage of its own
    knockoutsExist = true;
    if (stg === "FINAL" && m.state !== "post") continue;  // don't crown anyone until the final is decided
    const h = resolveTeam(m.home), a = resolveTeam(m.away);
    if (!h || !a) continue;
    const advName = m.advance ? (resolveTeam(m.advance) || {}).name : null;
    for (const team of [h, a]) {
      const prev = rec[team.name];
      if (!prev || order[stg] > order[prev.stage]) {
        rec[team.name] = { stage: stg, post: m.state === "post", advanced: m.state === "post" && advName === team.name };
      }
    }
  }

  const stages = {};
  for (const [name, r] of Object.entries(rec)) {
    if (r.stage === "FINAL") stages[name] = r.advanced ? { stage: "WIN", out: false } : { stage: "RU", out: true };
    else if (!r.post)        stages[name] = { stage: r.stage, out: false };          // playing / awaiting this round
    else if (r.advanced)     stages[name] = { stage: nextAfter[r.stage], out: false }; // won it — alive in the next round
    else                     stages[name] = { stage: r.stage, out: true };           // lost it — out here
  }
  // once the knockouts exist, any group team that didn't reach them is out
  if (knockoutsExist) groupTeams.forEach(name => { if (!rec[name]) stages[name] = { stage: "GROUP", out: true }; });
  return stages;
}

// Feed-derived stages with manual dash.stages layered on top (overrides win).
function effectiveDash(dash, matches) {
  dash = dash || { stages: {} };
  return { ...dash, stages: { ...deriveStages(matches), ...(dash.stages || {}) } };
}

// --- knockout bracket / eliminations ---------------------------------------
// Built from the manually-maintained dash.stages (the same source the
// leaderboard's "best run" uses). There are no head-to-head pairings in the
// data, so this reads as a round funnel — 32 → 16 → 8 → 4 → 2, left to right.
// Each team appears in every round it REACHED (so the columns halve like a
// real bracket); a strikethrough marks the round its run ended. Group-stage
// casualties are collected separately.
const KO_ROUNDS = [
  { key: "R32", label: "Round of 32",    short: "R32",   stages: ["R32"] },
  { key: "R16", label: "Round of 16",    short: "R16",   stages: ["R16"] },
  { key: "QF",  label: "Quarter-finals", short: "QF",    stages: ["QF"]  },
  { key: "SF",  label: "Semi-finals",    short: "SF",    stages: ["SF"]  },
  { key: "FIN", label: "Final",          short: "FINAL", stages: ["RU", "WIN"] },
];

function knockoutView(players, dash) {
  dash = dash || { stages: {} };
  const ownerOf = {};
  (players || []).forEach(pl => pl.teams.forEach(t => (ownerOf[t.name] = pl.name)));
  const stageOf = name => (dash.stages[name] || { stage: "GROUP", out: false });

  const all = TEAMS.map(t => {
    const s = stageOf(t.name);
    return {
      name: t.name, flag: t.flag, rank: t.rank, group: t.group,
      owner: ownerOf[t.name] || null,
      stage: s.stage, out: !!s.out,
      champ: s.stage === "WIN", runner: s.stage === "RU",
    };
  });
  const orderOf = t => STAGE_ORDER[t.stage];

  // Each round column holds every team that reached it. Per column, a team is:
  //   champ / runner — only in the Final; the two finalists
  //   out            — its run ended in this exact round (struck through)
  //   in             — it won this round (advanced) or is still playing it
  const statusRank = { champ: 0, in: 1, runner: 2, out: 3 };
  const rounds = KO_ROUNDS.map(r => {
    const threshold = STAGE_ORDER[r.stages[0]]; // R32→1 … FIN→RU(5)
    const isFinal = r.key === "FIN";
    const teams = all
      .filter(t => orderOf(t) >= threshold)
      .map(t => {
        let status;
        if (isFinal && t.champ) status = "champ";
        else if (isFinal && t.runner) status = "runner";
        else if (orderOf(t) === threshold && t.out && !t.champ) status = "out";
        else status = "in";
        return { ...t, status };
      })
      .sort((a, b) => (statusRank[a.status] - statusRank[b.status]) || (a.rank - b.rank));
    return { ...r, teams };
  });

  const EXITS = [
    { key: "GROUP", label: "Group stage" },
    { key: "R32",   label: "Round of 32" },
    { key: "R16",   label: "Round of 16" },
    { key: "QF",    label: "Quarter-finals" },
    { key: "SF",    label: "Semi-finals" },
  ];
  const eliminated = EXITS
    .map(e => ({
      key: e.key, label: e.label,
      teams: all.filter(t => t.out && t.stage === e.key && !t.champ && !t.runner)
                .sort((a, b) => a.rank - b.rank),
    }))
    .filter(g => g.teams.length);

  const started = all.some(t => STAGE_ORDER[t.stage] >= STAGE_ORDER.R32);
  return {
    rounds, eliminated, started,
    aliveCount: all.filter(t => !t.out).length,
    champion: all.find(t => t.champ) || null,
    runnerUp: all.find(t => t.runner) || null,
    ownerOf,
  };
}

// --- two-sided knockout bracket tree (for the 16:9 TV view) ------------------
// The feed names every knockout fixture by its feeders — "Round of 16 2 Winner
// at Round of 16 1 Winner", "Semifinal 1 Winner", "Semifinal 1 Loser" — and
// numbers matches sequentially by competition id within a round. That's enough
// to rebuild the exact tree: match a slot to the earlier match its team won,
// or to the numbered placeholder it names. The two Semi-final subtrees are the
// left and right halves (16 teams each); the Final and 3rd-place sit in the
// middle. `advance` (which resolves shootouts) marks the winner of each tie.
function parseSlotRef(name) {
  const m = /^(Round of 32|Round of 16|Quarterfinal|Semifinal) (\d+) (Winner|Loser)$/.exec(name || "");
  if (!m) return null;
  const round = { "Round of 32": "R32", "Round of 16": "R16", "Quarterfinal": "QF", "Semifinal": "SF" }[m[1]];
  return { round, num: parseInt(m[2], 10), wl: m[3] };
}

const FEED_KO_ROUND = {
  "round-of-32": "R32", "round-of-16": "R16", "quarterfinals": "QF",
  "semifinals": "SF", "final": "FINAL", "3rd-place-match": "THIRD",
};
const BR_PREV = { SF: "QF", QF: "R16", R16: "R32" };

function buildBracketTree(matches) {
  if (!matches || !matches.length) return { ok: false };
  const byRound = { R32: [], R16: [], QF: [], SF: [], FINAL: [], THIRD: [] };
  matches.forEach(m => { const k = FEED_KO_ROUND[m.roundSlug]; if (k) byRound[k].push(m); });
  if (!byRound.FINAL.length || byRound.R32.length < 2 || !byRound.SF.length) return { ok: false };
  Object.keys(byRound).forEach(k =>
    byRound[k].sort((a, b) => (parseInt(a.id, 10) || 0) - (parseInt(b.id, 10) || 0)));

  const advNameOf = m => (m.advance ? (resolveTeam(m.advance) || {}).name || m.advance : null);
  const slotInfo = (name, m) => {
    const ref = parseSlotRef(name);
    if (ref) return { placeholder: true, ref };
    const rt = resolveTeam(name);
    const nm = rt ? rt.name : name;
    const adv = advNameOf(m);
    return {
      placeholder: false, name: nm, flag: rt ? rt.flag : "",
      advanced: m.state === "post" && adv === nm,
      lost: m.state === "post" && !!adv && adv !== nm,
    };
  };
  const matchSlots = m => ({ a: slotInfo(m.home, m), b: slotInfo(m.away, m), state: m.state });

  const childOf = (s, srcKey) => {
    if (!srcKey) return null;
    if (s.placeholder) return (byRound[s.ref.round] || byRound[srcKey] || [])[s.ref.num - 1] || null;
    return (byRound[srcKey] || []).find(m => advNameOf(m) === s.name) || null;
  };

  // DFS one Semi-final subtree into columns, keeping top-to-bottom order
  const collect = sfMatch => {
    const cols = { SF: [], QF: [], R16: [], R32: [] };
    const walk = (m, rk) => {
      const ms = matchSlots(m);
      cols[rk].push(ms);
      if (rk === "R32") return;
      const src = BR_PREV[rk];
      [ms.a, ms.b].forEach(s => { const c = childOf(s, src); if (c) walk(c, src); });
    };
    walk(sfMatch, "SF");
    return cols;
  };

  const final = matchSlots(byRound.FINAL[0]);
  const leftSF = childOf(final.a, "SF"), rightSF = childOf(final.b, "SF");
  if (!leftSF || !rightSF) return { ok: false };
  const champion = final.a.advanced ? final.a : final.b.advanced ? final.b : null;

  return {
    ok: true,
    left: collect(leftSF),
    right: collect(rightSF),
    final, champion,
    third: byRound.THIRD.length ? matchSlots(byRound.THIRD[0]) : null,
  };
}

// Feed-derived boot/glove/spoon, with any admin overrides from dash.
function resolveAwardsFrom(dash, matches) {
  const aw = { boot: null, glove: null, spoon: null };
  if (dash && dash.bootTeam) aw.boot = { team: teamByName(dash.bootTeam), override: true };
  else if (matches) aw.boot = topScorer(matches);
  if (dash && dash.gloveTeam) aw.glove = { team: teamByName(dash.gloveTeam), override: true };
  else if (matches) aw.glove = cleanSheetLeader(matches);
  if (dash && dash.spoonOverride) aw.spoon = { team: teamByName(dash.spoonOverride), override: true, complete: true };
  else if (matches) aw.spoon = spoonStanding(matches);
  return aw;
}
