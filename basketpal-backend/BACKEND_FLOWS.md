# Basketpal Backend Flows

Mermaid diagrams of the FastAPI backend's request and background flows. The
backend follows a hexagonal architecture: HTTP entrypoints → application
services → ports (interfaces) → adapters (NBA API, Redis, OpenRouter).

## 1. Component / dependency wiring

```mermaid
flowchart TB
    subgraph entrypoints["entrypoints/web"]
        main["main.py<br/>FastAPI app + lifespan"]
        games["games.py<br/>/games/upcoming"]
        details["game_details.py<br/>/games/{id}/*"]
    end

    subgraph application["core/application"]
        svc["NBAStatsService"]
        poller["LeaguePoller<br/>(background task)"]
    end

    subgraph ports["core/ports (Protocols)"]
        p_nba["NBAStatsProvider"]
        p_store["StorageClient"]
        p_content["ContentProvider"]
    end

    subgraph adapters["adapters"]
        a_nba["NBAAPIStatsProvider<br/>(nba_api)"]
        a_redis["RedisClient<br/>(Redis)"]
        a_or["OpenRouterContentProvider<br/>(OpenRouter / LLMs)"]
    end

    main -->|lifespan starts| poller
    main --> games
    main --> details

    games --> p_nba
    details --> svc
    details --> p_content

    svc --> p_nba
    svc --> p_store
    poller --> svc
    poller --> p_store

    a_or --> p_nba
    a_or --> p_store

    p_nba -. implemented by .-> a_nba
    p_store -. implemented by .-> a_redis
    p_content -. implemented by .-> a_or

    a_nba -->|HTTP| ext_nba["NBA API<br/>(live + stats endpoints)"]
    a_redis --> ext_redis[("Redis")]
    a_or -->|HTTP| ext_or["OpenRouter<br/>LLM models"]
```

> In `MOCK_DATA` mode (`dependencies.py`), the adapters are swapped for
> `MockNBAStatsProvider`, `NullStorageClient`, and `MockContentProvider`.

## 2. Background polling flow (LeaguePoller)

Started as a FastAPI lifespan task; loops every 10s and snapshots live games.

```mermaid
flowchart TD
    start(["lifespan startup"]) --> loop{"_running?"}
    loop -->|yes| poll["poll_league()"]
    poll --> today["NBAStatsService.get_todays_games(league)"]
    today --> nbaapi1["NBAStatsProvider.get_games_dt_range(today, today)"]
    nbaapi1 --> iterate["for each game: poll_game()"]

    iterate --> should{"_should_poll_game?"}
    should -->|SCHEDULED| nearTip{"within 5 min<br/>of tipoff?"}
    should -->|IN_PROGRESS| sinceLast{">= 10s since<br/>last poll?"}
    should -->|FINAL| skip["skip"]

    nearTip -->|yes| fetch
    nearTip -->|no| skip
    sinceLast -->|yes| fetch
    sinceLast -->|no| skip

    fetch["get_boxscore(gameId)"] --> nbaapi2["NBAStatsProvider.get_boxscore"]
    nbaapi2 --> inprog{"gameStatus ==<br/>IN_PROGRESS?"}
    inprog -->|yes| save["set snapshotTime →<br/>StorageClient.save_snapshot()"]
    inprog -->|no| skip
    save --> redis[("Redis sorted set<br/>game:{id}:snapshots")]

    skip --> sleepN["asyncio.sleep(10s)"]
    redis --> sleepN
    sleepN --> loop
    loop -->|no| stop(["shutdown"])
```

## 3. Boxscore request with broadcast delay

`GET /games/{id}` and `/games/{id}/boxscore?delay=N`

```mermaid
sequenceDiagram
    participant C as Client
    participant D as game_details.py
    participant S as NBAStatsService
    participant N as NBAStatsProvider
    participant R as RedisClient

    C->>D: GET /games/{id}/boxscore?delay=N
    D->>S: get_boxscore(id, delay)
    S->>N: get_boxscore(id)
    N-->>S: live GameSnapshot

    alt FINAL or no delay
        S-->>D: live snapshot
    else live game + delay
        S->>R: get_snapshot(id, delay)
        R-->>S: (snapshot, ts) or None
        alt snapshot fresh (age < delay*2)
            S-->>D: delayed snapshot
        else stale / missing
            S-->>D: live snapshot
        end
    end

    D-->>C: 200 GameSnapshot

    note over D: ValueError → 404<br/>RequestException/KeyError → 502
```

## 4. AI game summary flow

`GET /games/{id}/summary?refresh=`

```mermaid
flowchart TD
    req(["GET /summary?refresh="]) --> cacheChk{"force_refresh?"}
    cacheChk -->|no| getCache["StorageClient.get(game:{id}:summary)"]
    getCache --> hit{"cached?"}
    hit -->|yes| ret(["return cached recap"])
    hit -->|no| build
    cacheChk -->|yes| build

    build["_build_game_context(id)"] --> ctx1["get_playbyplay + get_boxscore"]
    ctx1 --> ctx2["get_roster (home + away)"]
    ctx2 --> ctx3["format pbp / rosters / period scores"]

    ctx3 --> km["_extract_key_moments()<br/>LLM call w/ fallback"]
    km --> story["build_story_prompt + _call_with_fallback()"]
    story --> models["DEFAULT_MODEL → STORY_FALLBACK_MODEL"]
    models --> validate{"headline & recap valid?"}
    validate -->|no| models
    validate -->|yes| attach["recap.keyMoments = key_moments"]
    attach --> savecache["StorageClient.save(...)  (24h TTL)"]
    savecache --> ret
```

## 5. Model-comparison flow (blind recap)

`GET /games/{id}/model-comparison?refresh=`

```mermaid
flowchart TD
    req(["GET /model-comparison"]) --> cache{"cached &<br/>not refresh?"}
    cache -->|yes| ret(["return cached list"])
    cache -->|no| ctx["_build_game_context + _extract_key_moments"]
    ctx --> fan["ThreadPoolExecutor: run() per model"]

    fan --> m1["DeepSeek"]
    fan --> m2["Claude Sonnet"]
    fan --> m3["GLM"]
    fan --> m4["Qwen"]

    m1 --> collect
    m2 --> collect
    m3 --> collect
    m4 --> collect

    collect["collect recaps<br/>(failures → placeholder)"] --> shuffle["shuffle + assign blindLabel 'Recap A/B/...'"]
    shuffle --> save["StorageClient.save (24h TTL)"]
    save --> ret

    note["NotImplementedError → 501<br/>if provider doesn't support it"]
```

## Other endpoints

| Endpoint | Flow |
|---|---|
| `GET /games/upcoming` | `games.py` → `NBAStatsProvider.get_games_dt_range(start, end, league)` (defaults: today → +13 days) |
| `GET /games/{id}/playbyplay` | `game_details.py` → `NBAStatsService.get_playbyplay` → `NBAStatsProvider.get_playbyplay` |
