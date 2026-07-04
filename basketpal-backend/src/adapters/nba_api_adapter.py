import logging
import time
from datetime import datetime
from functools import lru_cache

import requests
from requests.exceptions import RequestException

logger = logging.getLogger(__name__)

from src.core.entities.game import GameSnapshot, GameStatus
from src.core.entities.leagues import League, current_season
from src.core.ports.nba_stats_provider import NBAStatsProvider


# NBA's edge (Akamai) silently drops requests whose headers don't match a real
# browser fingerprint — connection completes but no response is ever sent. These
# mirror the header set nba_api ships and are known to pass; do not trim them.
_STATS_HEADERS = {
    "Host": "stats.nba.com",
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.5",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "keep-alive",
    "Referer": "https://www.nba.com/",
    "Pragma": "no-cache",
    "Cache-Control": "no-cache",
    "Sec-Ch-Ua": '"Not:A-Brand";v="99", "Google Chrome";v="145", "Chromium";v="145"',
    "Sec-Ch-Ua-Mobile": "?0",
    "Sec-Fetch-Dest": "empty",
}

# cdn.nba.com (schedule + live boxscore feeds) rejects bare requests with HTTP
# 403 — it needs a browser fingerprint too. A lighter set than _STATS_HEADERS
# suffices; keep it in sync with the stats one if blocks reappear.
_CDN_HEADERS = {
    "User-Agent": _STATS_HEADERS["User-Agent"],
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.5",
    "Accept-Encoding": "gzip, deflate, br",
    "Referer": "https://www.nba.com/",
    "Origin": "https://www.nba.com",
}


def _normalize_result_set(data: dict, name: str) -> list:
    for rs in data.get("resultSets", []):
        if rs["name"] == name:
            headers = rs["headers"]
            return [dict(zip(headers, row)) for row in rs["rowSet"]]
    return []


class NBAAPIStatsProvider(NBAStatsProvider):

    # Only works for current season
    def get_games_dt_range(self, start_dt, end_dt, league: League):

        game_dates = _load_schedule(league)

        filtered = []
        for entry in game_dates:
            entry_date = datetime.strptime(entry["gameDate"], "%m/%d/%Y %H:%M:%S").date()

            if start_dt and entry_date < start_dt:
                continue
            if end_dt and entry_date > end_dt:
                continue

            games_on_date = []
            for game_json in entry["games"]:
                game = GameSnapshot.from_api(game_json)
                if game.gameStatus == GameStatus.IN_PROGRESS:
                    try:
                        game_dict = _fetch_live_boxscore(game.gameId)
                        game = GameSnapshot.from_api(game_dict)
                    except Exception:
                        logger.warning(f"Failed to fetch live boxscore for {game.gameId}, using schedule data")
                games_on_date.append(game)

            filtered.append({
                "gameDate": entry_date,
                "games": games_on_date
            })

        return filtered

    def get_boxscore(self, game_id: str):

        scheduled_game = _get_boxscore_from_schedule(game_id)

        if scheduled_game is None or scheduled_game.gameStatus != GameStatus.SCHEDULED:
            try:
                game_dict = _fetch_live_boxscore(game_id)
            except requests.exceptions.HTTPError:
                # Live CDN only serves recent games; fall back to the stats
                # endpoints for historical (FINAL) games.
                game_dict = _fetch_historical_boxscore(game_id)
            game = GameSnapshot.from_api(game_dict)

            # The schedule feed carries playoff series metadata (gameLabel,
            # seriesText) that the live/historical boxscore feeds don't; reuse
            # the lookup above instead of issuing another request for it.
            if scheduled_game is not None:
                game.gameLabel = game.gameLabel or scheduled_game.gameLabel
                game.seriesText = game.seriesText or scheduled_game.seriesText
                game.seriesGameNumber = game.seriesGameNumber or scheduled_game.seriesGameNumber

            return game

        return scheduled_game

    def get_playbyplay(self, game_id):
        try:
            # playbyplayv3 returns a nested {"game": {"actions": [...]}} payload,
            # not the tabular resultSets shape used by other stats endpoints.
            data = _stats_get(
                "playbyplayv3",
                {"GameID": game_id, "StartPeriod": 0, "EndPeriod": 14},
            )
            return data.get("game", {}).get("actions", [])
        except Exception:
            logger.warning(f"Play-by-play data unavailable for game {game_id}")
            return []

    def get_roster(self, team_id):
        resp = requests.get(
            "https://stats.nba.com/stats/commonteamroster",
            params={"TeamID": team_id, "Season": current_season()},
            headers=_STATS_HEADERS,
            timeout=30,
        )
        resp.raise_for_status()
        return _normalize_result_set(resp.json(), "CommonTeamRoster")

    def get_team_season_stats(self, season, league_id, season_type="Regular Season"):
        # leaguedashteamstats — per-game team season averages (PTS, REB, AST,
        # FG%, 3P%, TOV) plus season W/L/WinPCT for the whole league in one call.
        # The league*dash* family 500s unless the full filter param set is sent
        # (even as empty defaults) — nba_api ships all of these for that reason.
        data = _stats_get(
            "leaguedashteamstats",
            {
                "LeagueID": league_id,
                "Season": season,
                "SeasonType": season_type,
                "PerMode": "PerGame",
                "MeasureType": "Base",
                "Outcome": "", "Location": "", "Month": 0, "SeasonSegment": "",
                "DateFrom": "", "DateTo": "", "OpponentTeamID": 0, "VsConference": "",
                "VsDivision": "", "Conference": "", "Division": "", "TeamID": 0,
                "PlayerID": 0, "GameSegment": "", "Period": 0, "ShotClockRange": "",
                "LastNGames": 0, "PlusSplit": "N", "Rank": "N", "PaceAdjust": "N",
                "PlusMinus": "N",
            },
        )
        return _normalize_result_set(data, "LeagueDashTeamStats")

    def get_player_season_stats(self, season, league_id, season_type="Regular Season"):
        # leaguedashplayerstats — per-game player season averages league-wide;
        # caller filters by team and ranks to find leaders. Same full-param
        # requirement as get_team_season_stats.
        data = _stats_get(
            "leaguedashplayerstats",
            {
                "LeagueID": league_id,
                "Season": season,
                "SeasonType": season_type,
                "PerMode": "PerGame",
                "MeasureType": "Base",
                "Outcome": "", "Location": "", "Month": 0, "SeasonSegment": "",
                "DateFrom": "", "DateTo": "", "OpponentTeamID": 0, "VsConference": "",
                "VsDivision": "", "Conference": "", "Division": "", "TeamID": 0,
                "PlayerID": 0, "GameSegment": "", "Period": 0, "ShotClockRange": "",
                "LastNGames": 0, "PlusSplit": "N", "Rank": "N", "PaceAdjust": "N",
                "PlusMinus": "N",
            },
        )
        return _normalize_result_set(data, "LeagueDashPlayerStats")

    def get_team_game_log(self, team_id, season, league_id):
        # teamgamelog — that team's game-by-game log (WL, matchup, margin). The
        # MATCHUP field ("BOS vs. LAL" / "BOS @ LAL") lets the caller pull both
        # recent form and the season head-to-head from a single fetch per team.
        data = _stats_get(
            "teamgamelog",
            {
                "TeamID": team_id,
                "Season": season,
                "LeagueID": league_id,
                "SeasonType": "Regular Season",
            },
        )
        return _normalize_result_set(data, "TeamGameLog")


def _fetch_live_boxscore(game_id: str) -> dict:
    is_wnba = League.from_game_id(game_id) is League.WNBA
    if is_wnba:
        url = f"https://cdn.wnba.com/static/json/liveData/boxscore/boxscore_{game_id}.json"
        headers = {**_CDN_HEADERS, "Referer": "https://www.wnba.com/", "Origin": "https://www.wnba.com"}
    else:
        url = f"https://cdn.nba.com/static/json/liveData/boxscore/boxscore_{game_id}.json"
        headers = _CDN_HEADERS
    resp = requests.get(url, timeout=10, headers=headers)
    resp.raise_for_status()
    return resp.json()["game"]


def _stats_get(endpoint: str, params: dict, retries: int = 2, timeout: int = 15) -> dict:
    # stats.nba.com intermittently drops/rate-limits requests (the connection
    # hangs until timeout); a quick retry usually succeeds.
    last_exc = None
    for attempt in range(retries):
        try:
            resp = requests.get(
                f"https://stats.nba.com/stats/{endpoint}",
                params=params,
                headers=_STATS_HEADERS,
                timeout=timeout,
            )
            resp.raise_for_status()
            return resp.json()
        except (requests.exceptions.Timeout, requests.exceptions.ConnectionError) as exc:
            last_exc = exc
            time.sleep(0.5 * (attempt + 1))
    raise last_exc


@lru_cache(maxsize=256)
def _fetch_historical_boxscore(game_id: str) -> dict:
    """Build a live-boxscore-shaped dict for a finished game using the stats endpoints.

    Combines boxscoretraditionalv3 (team/player stats — required) with two
    best-effort sources: boxscoresummaryv2 (line scores, paint/fast-break/lead,
    game metadata) and boxscoretraditionalv2 (bench points — v3 has no reliable
    starter flag). Result is cached: historical games are immutable, so each
    page load reuses the first assembly instead of re-hammering stats.nba.com.
    """
    range_params = {
        "GameID": game_id, "StartPeriod": 0, "EndPeriod": 14,
        "StartRange": 0, "EndRange": 28800, "RangeType": 0,
    }
    # Core: without this we have no game — let failures propagate.
    box = _stats_get("boxscoretraditionalv3", range_params)["boxScoreTraditional"]
    if not box.get("homeTeam", {}).get("players"):
        # No data for this id (invalid / not yet played) — signal "not found".
        raise ValueError(f"No historical boxscore for game {game_id}")

    # Supplementary: line scores + paint/fast-break/lead + game metadata.
    meta, line_scores, other_stats = {}, {}, {}
    try:
        summary = _stats_get("boxscoresummaryv2", {"GameID": game_id}, retries=1)
        gs = _normalize_result_set(summary, "GameSummary")
        meta = gs[0] if gs else {}
        line_scores = {row["TEAM_ID"]: row for row in _normalize_result_set(summary, "LineScore")}
        other_stats = {row["TEAM_ID"]: row for row in _normalize_result_set(summary, "OtherStats")}
    except RequestException:
        logger.warning(f"Summary unavailable for historical game {game_id}; degrading line scores/paint")

    # Supplementary: bench points.
    bench_points = {}
    try:
        v2 = _stats_get("boxscoretraditionalv2", range_params, retries=1)
        bench_points = {
            row["TEAM_ID"]: row.get("PTS", 0)
            for row in _normalize_result_set(v2, "TeamStarterBenchStats")
            if row.get("STARTERS_BENCH") == "Bench"
        }
    except RequestException:
        logger.warning(f"Bench stats unavailable for historical game {game_id}; defaulting to 0")

    home = _build_historical_team(box["homeTeam"], line_scores, other_stats, bench_points)
    away = _build_historical_team(box["awayTeam"], line_scores, other_stats, bench_points)

    return {
        "gameId": game_id,
        "gameStatus": GameStatus.FINAL.value,
        "gameTimeUTC": meta.get("GAME_DATE_EST") or "",
        "gameCode": meta.get("GAMECODE") or game_id,
        "period": meta.get("LIVE_PERIOD"),
        "homeTeam": home,
        "awayTeam": away,
    }


# Per-quarter / OT columns in the boxscoresummaryv2 LineScore result set, in order.
_LINE_SCORE_PERIODS = [
    "PTS_QTR1", "PTS_QTR2", "PTS_QTR3", "PTS_QTR4",
    "PTS_OT1", "PTS_OT2", "PTS_OT3", "PTS_OT4",
    "PTS_OT5", "PTS_OT6", "PTS_OT7", "PTS_OT8", "PTS_OT9", "PTS_OT10",
]


def _build_historical_team(team: dict, line_scores: dict, other_stats: dict, bench_points: dict) -> dict:
    team_id = team["teamId"]
    line = line_scores.get(team_id, {})
    other = other_stats.get(team_id, {})

    periods = [{"score": line[col]} for col in _LINE_SCORE_PERIODS if line.get(col) not in (None, 0)]

    stats = dict(team.get("statistics", {}))
    players = [_build_historical_player(p) for p in team.get("players", [])]

    stats["pointsInThePaint"] = other.get("PTS_PAINT", 0)
    stats["fastBreakPointsMade"] = other.get("PTS_FB", 0)
    stats["biggestLead"] = other.get("LARGEST_LEAD", 0)
    stats["benchPoints"] = bench_points.get(team_id, 0)

    return {
        "teamId": team_id,
        "teamTricode": team.get("teamTricode"),
        "teamCity": team.get("teamCity"),
        "teamName": team.get("teamName"),
        "score": line.get("PTS", stats.get("points")),
        "periods": periods,
        "statistics": stats,
        "players": players,
    }


# boxscoretraditionalv3 omits a few per-player fields the live feed (and our entity)
# expect; default them so DNP/older payloads still validate.
_PLAYER_STAT_DEFAULTS = {
    "points": 0, "assists": 0, "reboundsDefensive": 0, "reboundsOffensive": 0,
    "reboundsTotal": 0, "steals": 0, "blocks": 0, "foulsPersonal": 0,
    "foulsTechnical": 0, "fieldGoalsAttempted": 0, "fieldGoalsMade": 0,
    "threePointersAttempted": 0, "threePointersMade": 0, "freeThrowsAttempted": 0,
    "freeThrowsMade": 0, "plusMinusPoints": 0, "minutes": "0:00",
    "pointsInThePaint": 0, "turnovers": 0,
}


def _build_historical_player(player: dict) -> dict:
    stats = player.get("statistics")
    if stats:
        stats = {**_PLAYER_STAT_DEFAULTS, **stats}

    return {
        "personId": player.get("personId"),
        "jerseyNum": player.get("jerseyNum"),
        "position": player.get("position"),
        "name": player.get("nameI") or f"{player.get('firstName', '')} {player.get('familyName', '')}".strip(),
        "nameI": player.get("nameI"),
        "statistics": stats,
    }


def _get_schedule_url(league: League):
    url = {
        League.NBA: "https://cdn.nba.com/static/json/staticData/scheduleLeagueV2_1.json",
        League.WNBA: "https://cdn.wnba.com/static/json/staticData/scheduleLeagueV2_1.json"
    }.get(league)

    return url


# The full-season schedule JSON is large and was being re-downloaded on every
# boxscore poll (every 5s per client, plus once per game per poller cycle).
# It also carries game status, so the TTL stays short: a game tipping off is
# seen as SCHEDULED for at most _SCHEDULE_CACHE_TTL seconds.
_SCHEDULE_CACHE_TTL = 60
_schedule_cache: dict = {}  # league -> (fetched_at, game_dates)


def _load_schedule(league: League) -> list:
    cached = _schedule_cache.get(league)
    if cached and time.time() - cached[0] < _SCHEDULE_CACHE_TTL:
        return cached[1]

    response = requests.get(_get_schedule_url(league), timeout=10, headers=_CDN_HEADERS)
    if response.status_code != 200:
        raise RequestException(
            f"Failed to fetch schedule for {league}: HTTP {response.status_code}"
        )

    game_dates = response.json()["leagueSchedule"]["gameDates"]
    _schedule_cache[league] = (time.time(), game_dates)
    return game_dates


def _get_boxscore_from_schedule(game_id):
    league = League.from_game_id(game_id)

    try:
        game_dates = _load_schedule(league)
    except RequestException:
        return None

    for entry in game_dates:
        for game_dict in entry["games"]:
            if game_dict.get("gameId") == game_id:
                return GameSnapshot.from_api(game_dict)

    return None
