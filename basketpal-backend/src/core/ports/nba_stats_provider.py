from typing import Protocol

from src.core.entities.game import GameSnapshot
from src.core.entities.leagues import League


class NBAStatsProvider(Protocol):
    def get_games_dt_range(self, start_dt, end_dt, league: League) -> dict:
        ...

    def get_boxscore(self, game_id: str) -> GameSnapshot:
        ...

    # def get_live_boxscore(self, game_id: str, data: dict) -> None:
    #     ...

    def get_playbyplay(self, game_id: str) -> dict:
        ...

    def get_roster(self, team_id: int) -> dict:
        ...

    def get_team_season_stats(self, season: str, league_id: str, season_type: str = "Regular Season") -> list[dict]:
        ...

    def get_player_season_stats(self, season: str, league_id: str, season_type: str = "Regular Season") -> list[dict]:
        ...

    def get_team_game_log(self, team_id: int, season: str, league_id: str) -> list[dict]:
        ...
