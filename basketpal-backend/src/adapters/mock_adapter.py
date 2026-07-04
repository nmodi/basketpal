import json
import time
from datetime import date, timedelta, datetime, timezone
from pathlib import Path
from typing import Any

from src.core.entities.game import GameSnapshot, GameStatus
from src.core.entities.leagues import League

_FIXTURES_DIR = Path(__file__).parent.parent.parent / "fixtures"

_GAME_IDS = {
    "scheduled": "0022401001",
    "in_progress": "0022401002",
    "final": "0022401003",
}


def _load_fixture(game_id: str) -> dict:
    with open(_FIXTURES_DIR / f"{game_id}.json") as f:
        return json.load(f)


class MockNBAStatsProvider:
    def __init__(self):
        self._games: dict[str, GameSnapshot] = {}
        now = datetime.now(timezone.utc)

        for role, game_id in _GAME_IDS.items():
            data = _load_fixture(game_id)
            if role == "scheduled":
                data["gameTimeUTC"] = (now + timedelta(days=1)).strftime("%Y-%m-%dT01:30:00Z")
            elif role == "in_progress":
                data["gameTimeUTC"] = now.strftime("%Y-%m-%dT%H:%M:%SZ")
            elif role == "final":
                data["gameTimeUTC"] = (now - timedelta(days=1)).strftime("%Y-%m-%dT22:00:00Z")
            self._games[game_id] = GameSnapshot.model_validate(data)

    def get_games_dt_range(self, start_dt: date, end_dt: date, league: League) -> list[dict]:
        today = date.today()
        tomorrow = today + timedelta(days=1)
        result = []

        if start_dt <= today <= end_dt:
            result.append({
                "gameDate": today,
                "games": [
                    self._games[_GAME_IDS["in_progress"]],
                    self._games[_GAME_IDS["final"]],
                ],
            })

        if start_dt <= tomorrow <= end_dt:
            result.append({
                "gameDate": tomorrow,
                "games": [self._games[_GAME_IDS["scheduled"]]],
            })

        return result

    def get_boxscore(self, game_id: str) -> GameSnapshot:
        if game_id not in self._games:
            raise ValueError(f"Mock game not found: {game_id}")
        return self._games[game_id]

    def get_playbyplay(self, game_id: str) -> list:
        return []

    def get_roster(self, team_id: int) -> list:
        return []

    def get_team_season_stats(self, season: str, league_id: str, season_type: str = "Regular Season") -> list:
        return []

    def get_player_season_stats(self, season: str, league_id: str, season_type: str = "Regular Season") -> list:
        return []

    def get_team_game_log(self, team_id: int, season: str, league_id: str) -> list:
        return []


class NullStorageClient:
    """In-memory storage client so the app runs without Redis in mock mode."""

    def __init__(self):
        self._snapshots: dict[str, list[tuple[float, GameSnapshot]]] = {}
        self._store: dict[str, Any] = {}

    def save_snapshot(self, game: GameSnapshot) -> None:
        self._snapshots.setdefault(game.gameId, []).append((time.time(), game))

    def get_snapshot(self, game_id: str, delay: int) -> tuple[GameSnapshot, float] | None:
        entries = self._snapshots.get(game_id, [])
        if not entries:
            return None
        cutoff = time.time() - delay
        for ts, snap in reversed(entries):
            if ts <= cutoff:
                return snap, ts
        return entries[0][1], entries[0][0]

    def save(self, key: str, data: Any) -> None:
        self._store[key] = data

    def save_with_ttl(self, key: str, data: Any, ttl: int) -> None:
        # TTL is ignored in mock mode — values live for the process lifetime.
        self._store[key] = data

    def get(self, key: str) -> Any:
        return self._store.get(key)


class MockInjuriesProvider:
    _INJURIES = [
        {"team_tricode": "LAL", "player_name": "LeBron James", "status": "Questionable", "injury_type": "Ankle", "return_type": None},
        {"team_tricode": "LAL", "player_name": "Anthony Davis", "status": "Probable", "injury_type": "Back", "return_type": None},
        {"team_tricode": "GSW", "player_name": "Stephen Curry", "status": "Out", "injury_type": "Knee", "return_type": None},
        {"team_tricode": "GSW", "player_name": "Draymond Green", "status": "Questionable", "injury_type": "Foot", "return_type": None},
        {"team_tricode": "BOS", "player_name": "Kristaps Porzingis", "status": "Probable", "injury_type": "Right calf", "return_type": None},
        {"team_tricode": "BOS", "player_name": "Jrue Holiday", "status": "Probable", "injury_type": "Shoulder", "return_type": None},
        {"team_tricode": "MIA", "player_name": "Jimmy Butler", "status": "Out", "injury_type": "Knee", "return_type": None},
    ]

    def get_injuries(self, league: League) -> list:
        return self._INJURIES


class MockContentProvider:
    def __init__(self, storage_client):
        self._storage = storage_client

    _SUMMARIES = {
        _GAME_IDS["final"]: {
            "headline": "Jokic's triple-double powers Nuggets past Clippers",
            "recap": (
                "The Denver Nuggets dominated the Los Angeles Clippers 118-104 on the strength of a vintage "
                "triple-double from Nikola Jokic, who finished with 32 points, 15 rebounds, and 10 assists. "
                "The two-time MVP was virtually unstoppable, drawing fouls at will and dissecting the Clippers' "
                "defense with surgical precision.\n\n"
                "Jamal Murray delivered the secondary scoring punch with 26 points and seven assists, while "
                "Michael Porter Jr. chipped in 22 points on efficient shooting. The Nuggets raced to a "
                "17-point halftime lead and never allowed Los Angeles to pull within 11 in the second half.\n\n"
                "Kawhi Leonard led the Clippers with 28 gutsy points, but turnovers — 10 of them — were their "
                "undoing. James Harden posted 20 points and a team-high 10 assists, yet Los Angeles couldn't "
                "overcome Denver's relentless half-court offense and the sheer dominance of Jokic on both ends."
            ),
            "keyMoments": [],
            "playerOfTheGame": {
                "name": "Nikola Jokic",
                "reason": "Recorded a triple-double and controlled the game on both ends.",
            },
        },
        _GAME_IDS["in_progress"]: {
            "headline": "Game is still in progress.",
            "recap": "Game is still in progress.",
            "keyMoments": [],
            "playerOfTheGame": None,
        },
    }

    def get_game_summary(self, game_id: str, force_refresh: bool = False) -> dict:
        result = self._SUMMARIES.get(game_id, {
            "headline": "Summary unavailable.",
            "recap": "Summary unavailable.",
            "keyMoments": [],
            "playerOfTheGame": None,
        })
        self._storage.save(f"game:{game_id}:summary", result)
        return result

    def get_model_comparison(self, game_id: str, force_refresh: bool = False) -> list[dict]:
        raise NotImplementedError("Model comparison is not supported by MockContentProvider")

    _PREVIEWS = {
        _GAME_IDS["scheduled"]: {
            "headline": "Warriors' firepower meets Lakers' size in prime-time clash",
            "preview": (
                "The Warriors bring the league's most explosive perimeter attack to "
                "Los Angeles for a marquee tilt against a Lakers team built on size, "
                "rim pressure, and home-court grit. Golden State's pace-and-space "
                "identity collides head-on with the Lakers' half-court physicality, "
                "setting up a stylistic contrast that should decide the night.\n\n"
                "Golden State has been streaky on the road but arrives riding a "
                "scoring surge from its backcourt, while the Lakers have protected "
                "home floor all season behind efficient interior play. With the "
                "season series still tight, every possession matters.\n\n"
                "Stephen Curry's shooting gravity warps every defense he faces, and "
                "LeBron James remains the engine of everything Los Angeles does. "
                "Expect a fourth-quarter chess match decided by which star imposes "
                "their will."
            ),
            "playersToWatch": [
                {
                    "name": "Stephen Curry",
                    "reason": "His shot-making and off-ball movement dictate Golden State's entire offense.",
                },
                {
                    "name": "LeBron James",
                    "reason": "Still the Lakers' primary playmaker and late-game closer.",
                },
                {
                    "name": "Anthony Davis",
                    "reason": "His rim protection is the key to slowing the Warriors' drives.",
                },
            ],
            "storylines": [
                "Three-point volume vs. paint efficiency — can the Warriors outscore the Lakers' size?",
                "Home-court edge: the Lakers have been tough to beat in their building.",
                "Fourth-quarter execution — which star closes under pressure?",
            ],
        },
    }

    def get_matchup_preview(self, game_id: str, force_refresh: bool = False) -> dict:
        result = self._PREVIEWS.get(game_id, {
            "headline": "Preview unavailable in mock mode.",
            "preview": "Preview unavailable in mock mode.",
            "playersToWatch": [],
            "storylines": [],
        })
        self._storage.save(f"game:{game_id}:matchup-preview", result)
        return result
