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

