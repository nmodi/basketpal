from datetime import date
from typing import List

from src.config.logger import get_logger
from src.core.entities.game import GameSnapshot
from src.core.entities.leagues import League
from src.core.ports import NBAStatsProvider

logger = get_logger(__name__)


class NBAStatsService:
    def __init__(self, nba_stats_provider: NBAStatsProvider):
        self.nba_stats_provider = nba_stats_provider

    def get_todays_games(self, league: League) -> List[GameSnapshot]:
        games_by_date = self.nba_stats_provider.get_games_dt_range(date.today(), date.today(), league)

        if not games_by_date:
            logger.warning("No data returned from NBA stats provider for today's date.")
            return []

        return games_by_date[0]["games"]

    def get_boxscore(self, game_id: str) -> GameSnapshot:
        return self.nba_stats_provider.get_boxscore(game_id)

    def get_playbyplay(self, game_id: str) -> dict:
        return self.nba_stats_provider.get_playbyplay(game_id)

    def get_roster(self, team_id: int) -> dict:
        return self.nba_stats_provider.get_roster(team_id)