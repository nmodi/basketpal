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

    def get_roster(self, team_id: str) -> dict:
        ...
