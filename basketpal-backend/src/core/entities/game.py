from enum import Enum
from pydantic import BaseModel, Field
from typing import List, Optional


class GameStatus(Enum):
    SCHEDULED = 1
    IN_PROGRESS = 2
    FINAL = 3


class TeamStats(BaseModel):
    reboundsOffensive: int
    reboundsTotal: int
    assists: int
    blocks: int
    steals: int
    turnovers: int
    fieldGoalsMade: int
    fieldGoalsAttempted: int
    freeThrowsMade: int
    freeThrowsAttempted: int
    threePointersMade: int
    threePointersAttempted: int
    benchPoints: int
    biggestLead: int
    pointsInThePaint: int
    fastBreakPointsMade: int


class BBallIndivStats(BaseModel):
    points: int
    assists: int
    reboundsDefensive: int
    reboundsOffensive: int
    reboundsTotal: int
    steals: int
    blocks: int
    foulsPersonal: int
    foulsTechnical: int
    fieldGoalsAttempted: int
    fieldGoalsMade: int
    fieldGoalsPercentage: Optional[float] = None
    threePointersAttempted: int
    threePointersMade: int
    threePointersPercentage: Optional[float] = None
    freeThrowsAttempted: int
    freeThrowsMade: int
    freeThrowsPercentage: Optional[float] = None
    plusMinusPoints: int
    minutes: str
    pointsInThePaint: int
    turnovers: int


class BBallPlayer(BaseModel):
    playerId: int | None = None
    jerseyNum: str = None
    position: str | None = None
    name: str = None
    nameAbbr: str | None = None
    stats: BBallIndivStats | None  = None


class TeamSummary(BaseModel):
    teamId: int
    teamTricode: str
    teamCity: str
    teamName: str
    score: Optional[int] = None
    periodScores: List[int] = Field(default_factory=list)
    timeoutsRemaining: int = None
    inBonus: bool = None
    statistics: Optional[TeamStats] = None
    onCourtPlayers: List[BBallPlayer] = Field(default_factory=list)
    players: List[BBallPlayer] = Field(default_factory=list)

    @classmethod
    def from_api(cls, data: dict):
        data = data.copy()
        periods = data.pop("periods", [])
        raw_players = data.pop("players", [])
        raw_statistics = data.pop("statistics", None)

        on_court = []
        all_players = []
        for player in raw_players:
            bball_player = BBallPlayer(
                playerId=int(player["personId"]) if player.get("personId") else None,
                jerseyNum=player.get("jerseyNum"),
                position=player.get("position"),
                name=player.get("name"),
                nameAbbr=player.get("nameI"),
                stats=BBallIndivStats(**player["statistics"]) if player.get("statistics") else None
            )
            all_players.append(bball_player)
            if player.get("oncourt") == "1":
                on_court.append(bball_player)

        statistics = TeamStats(**raw_statistics) if raw_statistics else None

        return cls(
            **data,
            statistics=statistics,
            periodScores=[item["score"] for item in periods],
            onCourtPlayers=on_court,
            players=all_players
        )


class GameSnapshot(BaseModel):
    snapshotTime: str = None
    gameId: str
    gameStatus: GameStatus
    gameTimeUTC: str
    gameClock: str = None
    gameCode: str
    period: Optional[int] = None
    gameLabel: Optional[str] = None
    seriesText: Optional[str] = None
    seriesGameNumber: Optional[str] = None
    homeTeam: TeamSummary
    awayTeam: TeamSummary

    @classmethod
    def from_api(cls, data: dict):

        data = data.copy()
        # Schedule API splits date/time into separate fields; gameDateTimeUTC is the full ISO datetime.
        # Live boxscore API already provides gameTimeUTC as a full ISO datetime.
        if 'gameDateTimeUTC' in data:
            data['gameTimeUTC'] = data.pop('gameDateTimeUTC')

        home_team_data = data.pop("homeTeam")
        away_team_data = data.pop("awayTeam")

        return cls(
            **data,
            homeTeam=TeamSummary.from_api(home_team_data),
            awayTeam=TeamSummary.from_api(away_team_data)
        )
