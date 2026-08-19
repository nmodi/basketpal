# ESPN adapter migration plan

## Why

NBA's edge (Akamai) blocks datacenter IPs: `cdn.nba.com` / `cdn.wnba.com` 403 every
request from Render regardless of headers, and `stats.nba.com` hangs until timeout.
Verified 2026-08-19 — residential IPs with browser-fingerprint headers pass, cloud IPs
never do. ESPN's public site API (`site.api.espn.com`) is unauthenticated, has no bot
wall, and already powers `ESPNInjuriesProvider` in this repo. The hexagonal
architecture means the swap is one new adapter behind `NBAStatsProvider` plus small
frontend asset-URL changes.

## Inventory: what actually needs replacing

Port surface (`core/ports/nba_stats_provider.py`) and its real consumers:

| Port method | Consumers | Current source | Needed? |
|---|---|---|---|
| `get_games_dt_range` | index page, `LeaguePoller` | cdn schedule JSON | yes |
| `get_boxscore` | game page, poller snapshots, recap fact-checks | cdn liveData + stats fallback | yes |
| `get_playbyplay` | `/playbyplay` endpoint only — **no frontend consumer** | stats.nba.com playbyplayv3 | optional |
| `get_roster` | report agent tools | stats.nba.com | yes |
| `get_team_season_stats` | report agent tools | stats.nba.com | yes |
| `get_player_season_stats` | report agent tools | stats.nba.com | yes |
| `get_team_game_log` | report agent tools | stats.nba.com | yes |

Notes:
- There is **no `/shots` endpoint or ShotChart component** in the current code (CLAUDE.md
  is stale on this) — shot-coordinate mapping is out of scope.
- Injuries already come from ESPN. Reuse its header set and conventions.

## Verified ESPN endpoints (probed 2026-08-19, WNBA slate)

Base: `https://site.api.espn.com/apis/site/v2/sports/basketball/{nba|wnba}`

1. **Scoreboard / schedule**: `GET {base}/scoreboard?dates=YYYYMMDD`
   - Events carry: `id`, `date`, `status.type.state` (`pre`/`in`/`post`),
     `status.period`, `status.displayClock`, competitors with `score`,
     per-period `linescores`, `records`, and full team info
     (`id`, `abbreviation`, `displayName`, `location`, `logo`).
   - Replaces both the season schedule JSON *and* the per-game live enrichment in
     `get_games_dt_range` (live scores are inline — fewer requests than today).
   - **Verify:** ranged form `?dates=YYYYMMDD-YYYYMMDD` for the index's −10d..+17d
     window; if capped, fan out per-day with a short cache.

2. **Boxscore**: `GET {base}/summary?event={id}`
   - `boxscore.teams[].statistics[]` names seen: `fieldGoalsMade-fieldGoalsAttempted`,
     `threePointFieldGoalsMade-...`, `freeThrowsMade-...`, `totalRebounds`,
     `offensiveRebounds`, `defensiveRebounds`, `assists`, `steals`, `blocks`,
     `turnovers`, `fastBreakPoints`, `pointsInPaint`, `largestLead`, `fouls`.
   - `boxscore.players[].statistics[0]`: `names` = `[MIN, PTS, FG, 3PT, FT, REB, AST,
     TO, STL, BLK, OREB, DREB, PF, +/-]`, per-athlete `stats` (strings, `"8-15"`
     combined makes-attempts), plus flags `starter`, `active`, `didNotPlay`, `ejected`,
     and `athlete.id`/`displayName`.
   - Also includes `plays` (future PBP), `injuries`, `gameInfo`.

3. **Roster**: `GET {base}/teams/{teamId}/roster` (standard ESPN endpoint — verify shape).

4. **Team game log**: `GET {base}/teams/{teamId}/schedule` — past events include
   scores/results (verify W/L + opponent extraction covers what
   `get_team_game_log` consumers read: points, plus-minus-derived opponent score,
   matchup/venue).

5. **Season stats** (agent research only, lowest confidence — verify first):
   - Team per-game averages + W/L: `{base}/standings` for records;
     `sports.core.api.espn.com/v2/sports/basketball/leagues/{lg}/seasons/{yr}/types/2/teams/{id}/statistics` for averages.
   - Player per-game averages:
     `site.web.api.espn.com/apis/common/v3/sports/basketball/{lg}/statistics/byathlete?season={yr}`.
   - Fallback if these disappoint: these feed LLM prompts, not typed UI — the dossier
     tolerates a different shape, so team leaders can also be pulled from
     scoreboard `competitors[].leaders`.

## Game ID / league strategy

ESPN event ids (`401857152`) don't encode the league, but `League.from_game_id`
(backend) and `getLeague` (frontend `util/league.js`) both key off NBA's `00`/`10`
prefixes, and every game endpoint + Redis key is game-id-scoped.

**Decision: synthetic prefixed ids** — `nba-401857152` / `wnba-401857152`.
- Backend: `League.from_game_id` learns the prefixes; adapter strips prefix before
  calling ESPN, prepends on the way out.
- Frontend: `getLeague` becomes a prefix check. Routes/links unchanged otherwise.
- Redis keys inherit the new ids automatically. Nothing durable is keyed by old NBA
  ids (summaries have 24h TTL), so no migration.

## Entity mapping (entities do NOT change shape)

New `espn_stats_adapter.py` maps ESPN → existing Pydantic entities directly
(don't reuse `GameSnapshot.from_api`, which is NBA-liveData-shaped).

- **GameStatus**: `pre`→SCHEDULED, `in`→IN_PROGRESS, `post`→FINAL.
- **gameClock**: entity stores a string; pass ESPN `status.displayClock` ("4:31")
  — grep frontend for `PT`-format parsing first; convert to `PT4M31.00S` only if
  something parses it.
- **TeamStats** (16 fields): direct for rebounds/assists/blocks/steals/turnovers/
  paint/fastbreak/largestLead; split `"m-a"` strings for FG/3P/FT;
  **`benchPoints` derived** = Σ player PTS where `starter == False` (used by
  TeamStatsComparison and Keys-to-the-Win, so it must be filled).
- **BBallIndivStats**: parse the label-aligned string rows; percentages computed;
  `foulsTechnical`/`pointsInThePaint` (per-player) aren't in ESPN — give the entity
  fields `= 0` defaults (no frontend consumer reads per-player paint points).
- **onCourtPlayers**: hypothesis — ESPN's per-athlete `active` flag marks on-floor
  players during live games (it's `False` on finals). **Must be verified against a
  live game before rollout**; if wrong, fall back to starters and hide the
  "on court" framing, or read gamecast substitution plays.
- **Headshot/team assets**: athlete id is an ESPN id — see frontend section.

## Frontend changes

- `common/PlayerImage.jsx`: `https://a.espncdn.com/i/headshots/{nba|wnba}/players/full/{id}.png`.
- `common/TeamIcon.jsx`: switch from NBA teamId URL to
  `https://a.espncdn.com/i/teamlogos/{nba|wnba}/500/{ABBREV}.png` (tricode-based), or
  pass through the `team.logo` URL ESPN already returns in the scoreboard payload
  (smaller: entity already carries teamTricode; no new field needed for the former).
- `util/league.js` `getLeague`: prefix check per the ID strategy.

## Rollout

Phase gates — each phase ships and is verified before the next:

1. **Core UI (scoreboard + boxscore)**: implement `get_games_dt_range` +
   `get_boxscore` in the new adapter. Wire behind `STATS_PROVIDER=espn|nba` env
   switch in `dependencies.py` (default `nba` locally, `espn` in prod). Frontend
   asset/id changes land here too.
2. **Research endpoints**: roster, season stats, game logs. The agent's
   fact-checks (`_check_recap_facts`) run against `GameSnapshot`, so they work
   unchanged once boxscores flow.
3. **Cleanup**: `get_playbyplay` from `summary.plays` (or drop the endpoint — no
   consumer), retire the stale-schedule fallback machinery, update CLAUDE.md +
   AGENTS.md (both — repo rule) and remove NBA CDN headers if fully retired.

**Testing leverage (why this is safe):** locally, *both* providers work — record
ESPN JSON fixtures for golden unit tests (existing `tests/unit` conventions), and run
a side-by-side diff of `GameSnapshot` from `NBAAPIStatsProvider` vs the ESPN adapter
for the same live WNBA game to catch mapping errors empirically. WNBA is in season
now, so live verification (`active` flag, clock, linescores) can happen immediately.

## Risks

- **Unofficial API**: ESPN can change shapes without notice (has been stable for
  years; the injuries adapter already accepts this risk). Mitigation: defensive
  parsing + the `STATS_PROVIDER` flag makes NBA-direct an instant rollback locally.
- **`active` flag semantics** — the one real unknown for the live UI; verify first
  (it gates OnCourtPlayers).
- **Rate limits**: undocumented; poller at 10s/game + 5s client polls through the
  backend is modest. Keep the existing per-game-id caching; add a 5s summary cache
  if needed.
- **Stat-name drift NBA vs WNBA trees**: probe confirmed WNBA names; spot-check NBA
  preseason (October) before NBA season starts.
