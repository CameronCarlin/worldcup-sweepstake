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
    return {
      date: e.date,
      round: ((e.season && e.season.slug) || "").replace(/-/g, " "),
      state: e.status.type.state, // pre | in | post
      detail: e.status.type.shortDetail || "",
      home: home.team.displayName, hs: home.score,
      away: away.team.displayName, as: away.score,
      scorers,
    };
  });
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
