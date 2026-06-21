# Basketpal

Real-time NBA game tracker with live player stats, team comparisons, broadcast delay simulation, and AI-generated game summaries.

## Rules

- Never `git commit` or `git push`. All commits and pushes must be done manually by the user.
- Any changes to AGENTS.md must also be reflected in CLAUDE.md and vice versa.

## Repo structure

```
basketpal/
├── basketpal-backend/   # FastAPI Python backend
├── basketpal-fe/        # Remix + React frontend
└── dev.sh               # Starts both services + Redis
```

## Development

```bash
# Start everything (Redis, backend on :8001, frontend on :5173)
./dev.sh
```

Backend uses a `.venv` inside `basketpal-backend/`. Frontend uses npm.

Environment variables needed in `basketpal-backend/.env`:
- `OPENROUTER_API_KEY` — used by `OpenRouterContentProvider` (default content provider) for game summaries and model comparisons
- `REDIS_URL` — defaults to localhost

## Architecture

### Backend (`basketpal-backend/src/`)

Hexagonal architecture — ports (interfaces) in `core/`, adapters implement them.

```
core/
  entities/       # Pydantic domain models
    game.py         # GameSnapshot, TeamSummary, TeamStats, BBallPlayer, BBallIndivStats
    leagues.py      # League enum (NBA, WNBA)
  ports/          # Protocol interfaces
    nba_stats_provider.py
    storage_client.py
    content_generator.py
  application/    # Business logic / use cases
    nba_stats_service.py   # get_boxscore (with delay), get_playbyplay, get_shots
    league_poller.py       # Background async task: polls in-progress games every 10s

adapters/         # Implementations of ports
  nba_api_adapter.py          # nba_api library → NBAStatsProvider
  redis_client.py             # Redis → StorageClient
  openrouter_content_generator.py # OpenRouter → ContentProvider

config/
  dependencies.py   # Singleton wiring (dependency injection)

entrypoints/web/
  main.py           # FastAPI app, lifespan (starts LeaguePoller)
  games.py          # GET /games/upcoming?league=
  game_details.py   # GET /games/{gameId}, /boxscore, /playbyplay, /summary, /shots
```

**Key patterns:**
- All services are singletons wired in `dependencies.py`; never instantiate them elsewhere
- Add new ports as `Protocol` classes in `core/ports/`, implement in `adapters/`
- `LeaguePoller` runs as a FastAPI lifespan background task — not triggered per-request

### Redis storage

| Key | Type | Content |
|---|---|---|
| `game:{gameId}:snapshots` | Sorted set | Full `GameSnapshot` JSON, scored by unix timestamp |
| `game:{gameId}:summary` | String | Cached recap JSON (`headline`/`recap`/`playerOfTheGame`/`keyMoments`), 24hr TTL |
| `game:{gameId}:model-comparison` | String | Cached list of per-model recap JSON objects (blind model comparison view), 24hr TTL |

Snapshots are stored only for `IN_PROGRESS` games. The delay feature (`?delay=N`) retrieves the snapshot from N seconds ago using `zrevrangebyscore`.

`TeamSummary.statistics` is a typed `TeamStats` model — only the 16 fields the frontend reads are stored. The raw NBA API returns ~40 fields; excess is dropped in `TeamSummary.from_api`.

### NBA API notes

- Live boxscore + PBP: `nba_api.live.nba.endpoints` (works for all games)
- Play-by-play with shot coordinates: `PlayByPlayV3` (stats endpoint) — provides `xLegacy`, `yLegacy`, `shotResult`, `isFieldGoal`
- `PlayByPlayV2` is **deprecated and broken** — the NBA API stopped returning data for it; don't use it
- Shot coordinates: x ∈ [−250, 250], y ∈ [−52, ~890] in tenths of a foot. Shots with y > 422 are from the far basket and need normalization: `x = -x, y = 422 - (y - 422)`

### Frontend (`basketpal-fe/app/`)

Remix (SSR + client polling). Chakra UI for components. No charting library — SVG drawn directly.

```
routes/
  nba._index.jsx        # Upcoming games list
  nba.g.$gameId.jsx     # Game page (Minitron component)

components/
  Scoreboard/           # Score display, period breakdown
  OnCourtPlayers.jsx    # Live 5-player table with emoji performance badges
  TeamStatsComparison.jsx # Side-by-side team stats (16 stat rows)
  ShotChart.jsx         # SVG half-court shot chart
  Postgame.jsx          # POTG, keys to the win, AI game story
  GamePreview.jsx       # Pre-game countdown
  Microtron.jsx         # Game card for the index page
  common/               # PlayerImage, TeamIcon

util/
  axios.js              # Axios instance — localhost:8001 in dev, onrender.com in prod
  gameUtils.js          # getTopPlayers (by PIE), evaluateKeysToTheWin
  statFunctions.js      # calculatePIE, calculateGameScore, getTrueShootingPercentage,
                        # hasTripleDouble, tripleDoubleWatch, getBestStats
  league.js             # League enum, game ID → league parsing
```

**Game page data flow:**

1. Remix `loader` fetches initial data server-side
2. If game not started: returns scoreboard only, polls every 30s
3. If game started: fetches boxscore + summary (+ shots) in parallel
4. Client polls boxscore every 5s during live games
5. Delay queue: pushes snapshots, releases at user-selected offset (0–120s)

**Tab visibility:**
- `gameStatus === 1` (SCHEDULED): Game Preview tab only
- `gameStatus === 2` (IN_PROGRESS): On Court + Team Comparison + Shot Chart
- `gameStatus === 3` (FINAL): Postgame Report + Team Comparison + Shot Chart

**Advanced stats used in the UI:**
- **PIE** — Player Impact Estimate, used to rank players for POTG
- **Game Score** — Holistic contribution metric, shown in OnCourtPlayers
- **True Shooting %** — Used for hot/cold emoji badges (>60% = 🔥, <45% = 🧊)
- **Keys to the Win** — Top weighted stat differentials explaining game outcome

## API endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/games/upcoming?league=nba` | Games for next 5 days |
| GET | `/games/{gameId}` | Current game state (GameSnapshot) |
| GET | `/games/{gameId}/boxscore?delay=N` | Boxscore, optionally N seconds delayed |
| GET | `/games/{gameId}/playbyplay` | Play-by-play events |
| GET | `/games/{gameId}/shots` | FG attempts with x/y coordinates |
| GET | `/games/{gameId}/summary` | AI-generated game summary (cached) |

## Deployment

- Both services deployed on Render (`render.yaml`, `Procfile`)
- Production backend: `https://basketpal-be.onrender.com`
- Frontend axios switches baseURL automatically based on `NODE_ENV`
