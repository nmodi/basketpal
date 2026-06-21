from src.core.entities.game import BBallPlayer, GameSnapshot, GameStatus, TeamSummary


def _minimal_team(team_id: int, tricode: str) -> TeamSummary:
    """A team with no in-game stats yet — timeoutsRemaining/inBonus left at
    their default None, mirroring a SCHEDULED game's payload."""
    return TeamSummary(
        teamId=team_id,
        teamTricode=tricode,
        teamCity="Los Angeles",
        teamName="Lakers",
    )


def test_game_snapshot_round_trips_through_json_with_unset_optional_fields():
    """Regression: snapshotTime/gameClock and TeamSummary.timeoutsRemaining/
    inBonus were declared as non-Optional with a None default, so dumping
    with exclude_none=False (as RedisClient.save_snapshot does) and reloading
    via model_validate_json used to raise a pydantic ValidationError."""
    snapshot = GameSnapshot(
        gameId="0022401099",
        gameStatus=GameStatus.SCHEDULED,
        gameTimeUTC="2026-01-01T00:00:00Z",
        gameCode="20260101/LALGSW",
        homeTeam=_minimal_team(1, "LAL"),
        awayTeam=_minimal_team(2, "GSW"),
    )

    dumped = snapshot.model_dump_json(exclude_none=False)
    reloaded = GameSnapshot.model_validate_json(dumped)

    assert reloaded.gameId == snapshot.gameId
    assert reloaded.snapshotTime is None
    assert reloaded.gameClock is None
    assert reloaded.homeTeam.timeoutsRemaining is None
    assert reloaded.homeTeam.inBonus is None


def test_bball_player_round_trips_with_unset_optional_fields():
    player = BBallPlayer(playerId=123)

    dumped = player.model_dump_json(exclude_none=False)
    reloaded = BBallPlayer.model_validate_json(dumped)

    assert reloaded.playerId == 123
    assert reloaded.jerseyNum is None
    assert reloaded.name is None
