from typing import Protocol

from src.core.entities.leagues import League


class InjuriesProvider(Protocol):
    """Provides player injury/availability info.

    Implemented separately from NBAStatsProvider because the source is a
    non-stats.nba.com feed (ESPN), with its own host and header set.
    """

    def get_injuries(self, league: League) -> list[dict]:
        ...
