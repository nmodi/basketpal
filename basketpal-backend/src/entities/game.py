from enum import Enum
from pydantic import BaseModel, Field
from typing import List, Optional


class GameStatus(Enum):
    SCHEDULED = 1
    IN_PROGRESS = 2
    FINAL = 3


class PlayerStats(BaseModel):
    points: int
    assists: int
    rebDef: int
    rebOff: int
    steals: int
    blocks: int
    fouls: int
    fgAtt: int
    fgMd: int
    threePtAtt: int
    threePtMd: int
    freeThrAtt: int
    freeThrMd: int
    plusMinus: int
    min: str
    ptsInPnt: int
    to: int


class Player(BaseModel):
    playerId: int = None
    jerseyNum: str = None
    position: str = None
    name: str = None
    nameAbbr: str = None
    stats: PlayerStats = None


class TeamSummary(BaseModel):
    teamId: int
    teamTricode: str
    periodScores: List[int] = Field(default_factory=list)
    timeoutsRemaining: int = None
    inBonus: bool = None
    onCourtPlayers: List[Player] = Field(default_factory=list)

    @classmethod
    def from_api(cls, data: dict):
        data = data.copy()
        periods = data.pop("periods")
        players = data.pop("players")

        print(players)

        return cls(
            **data,
            periodScores=[item["score"] for item in periods],
            onCourtPlayers=[player for player in players if player["oncourt"] == "1"]
        )


class GameSnapshot(BaseModel):
    gameId: str
    gameStatus: GameStatus
    gameTimeUTC: str
    gameClock: str = None
    gameCode: str
    period: Optional[int] = None
    homeTeam: TeamSummary
    awayTeam: TeamSummary

    @classmethod
    def from_api(cls, data: dict):

        data = data.copy()
        home_team_data = data.pop("homeTeam")
        away_team_data = data.pop("awayTeam")

        return cls(
            **data,
            homeTeam=TeamSummary.from_api(home_team_data),
            awayTeam=TeamSummary.from_api(away_team_data)
        )
