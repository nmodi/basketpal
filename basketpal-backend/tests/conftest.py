import os

# Must happen before anything imports src.config.dependencies, which wires up
# real Redis/OpenRouter clients at *import time* based on this env var.
os.environ["MOCK_DATA"] = "1"

import pytest

from src.core.entities.game import GameSnapshot, GameStatus, TeamSummary


def make_team(team_id: int = 1, tricode: str = "LAL") -> TeamSummary:
    return TeamSummary(
        teamId=team_id,
        teamTricode=tricode,
        teamCity="Los Angeles",
        teamName="Lakers",
        timeoutsRemaining=7,
        inBonus=False,
    )


def make_snapshot(game_id: str = "0022401099", status: GameStatus = GameStatus.IN_PROGRESS) -> GameSnapshot:
    return GameSnapshot(
        gameId=game_id,
        gameStatus=status,
        gameTimeUTC="2026-01-01T00:00:00Z",
        gameClock="PT10M00.00S",
        gameCode="20260101/LALGSW",
        snapshotTime="2026-01-01T00:00:00+00:00",
        homeTeam=make_team(1, "LAL"),
        awayTeam=make_team(2, "GSW"),
    )


@pytest.fixture
def snapshot_factory():
    return make_snapshot
