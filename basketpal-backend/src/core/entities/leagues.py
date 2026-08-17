from datetime import date
from enum import Enum


class League(Enum):
    WNBA = ("wnba", "10")
    NBA = ("nba", "00")

    def __init__(self, code, league_id):
        self.code = code
        self.league_id = league_id

    @classmethod
    def from_code(cls, code: str) -> "League":
        for league in cls:
            if league.code == code:
                return league
        raise ValueError(f"Unknown league code: {code}")

    @classmethod
    def from_game_id(cls, game_id: str) -> "League":
        # Game ids are prefixed with the league id ("0022300001" → NBA).
        return cls.NBA if game_id.startswith(cls.NBA.league_id) else cls.WNBA

    @classmethod
    def from_team_id(cls, team_id) -> "League":
        # WNBA team ids start with 16116, NBA with 16106.
        return cls.WNBA if str(team_id).startswith("16116") else cls.NBA


def current_season(league: League = League.NBA) -> str:
    """Current season string. NBA: "2025-26" (rolls over in October).
    WNBA: single calendar year "2026" (rolls over in May)."""
    today = date.today()
    if league is League.WNBA:
        year = today.year if today.month >= 5 else today.year - 1
        return str(year)
    year = today.year if today.month >= 10 else today.year - 1
    return f"{year}-{str(year + 1)[-2:]}"

