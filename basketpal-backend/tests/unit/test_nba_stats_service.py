import time

from src.core.application.nba_stats_service import NBAStatsService
from src.core.entities.game import GameStatus


class FakeProvider:
    def __init__(self, game):
        self.game = game
        self.boxscore_calls = 0

    def get_boxscore(self, game_id):
        self.boxscore_calls += 1
        return self.game

    def get_games_dt_range(self, start_dt, end_dt, league):
        return []

    def get_playbyplay(self, game_id):
        return []

    def get_roster(self, team_id):
        return []


class FakeStorage:
    def __init__(self, snapshot_result):
        self._snapshot_result = snapshot_result

    def get_snapshot(self, game_id, delay):
        return self._snapshot_result

    def save_snapshot(self, game):
        pass

    def save(self, key, data):
        pass

    def get(self, key):
        return None


def test_get_boxscore_no_delay_fetches_provider_once(snapshot_factory):
    game = snapshot_factory(status=GameStatus.IN_PROGRESS)
    provider = FakeProvider(game)
    service = NBAStatsService(provider, FakeStorage(None))

    result = service.get_boxscore(game.gameId, delay=None)

    assert result is game
    assert provider.boxscore_calls == 1


def test_get_boxscore_final_game_skips_snapshot_lookup_even_with_delay(snapshot_factory):
    game = snapshot_factory(status=GameStatus.FINAL)
    provider = FakeProvider(game)
    service = NBAStatsService(provider, FakeStorage(None))

    result = service.get_boxscore(game.gameId, delay=10)

    assert result is game
    assert provider.boxscore_calls == 1


def test_get_boxscore_with_no_snapshot_yet_falls_back_to_live(snapshot_factory):
    """Regression for H2: get_snapshot returning None (empty Redis result) must not crash."""
    game = snapshot_factory(status=GameStatus.IN_PROGRESS)
    provider = FakeProvider(game)
    service = NBAStatsService(provider, FakeStorage(None))

    result = service.get_boxscore(game.gameId, delay=10)

    assert result is game


def test_get_boxscore_returns_fresh_snapshot_within_window(snapshot_factory):
    """Regression for H1: freshness must be computed from the snapshot's numeric
    unix score, not the (string) snapshotTime field, or this raises before
    ever reaching this assertion."""
    live_game = snapshot_factory(status=GameStatus.IN_PROGRESS)
    cached_game = snapshot_factory(status=GameStatus.IN_PROGRESS)
    fresh_ts = time.time()
    provider = FakeProvider(live_game)
    service = NBAStatsService(provider, FakeStorage((cached_game, fresh_ts)))

    result = service.get_boxscore(live_game.gameId, delay=10)

    assert result is cached_game


def test_get_boxscore_falls_back_to_live_when_snapshot_is_stale(snapshot_factory):
    live_game = snapshot_factory(status=GameStatus.IN_PROGRESS)
    cached_game = snapshot_factory(status=GameStatus.IN_PROGRESS)
    stale_ts = time.time() - 1000
    provider = FakeProvider(live_game)
    service = NBAStatsService(provider, FakeStorage((cached_game, stale_ts)))

    result = service.get_boxscore(live_game.gameId, delay=10)

    assert result is live_game


def test_get_boxscore_fetches_provider_only_once_per_call(snapshot_factory):
    """Regression for M1: get_boxscore used to call the provider twice
    (once via get_game_status, once directly) on every non-FINAL request."""
    game = snapshot_factory(status=GameStatus.IN_PROGRESS)
    provider = FakeProvider(game)
    service = NBAStatsService(provider, FakeStorage(None))

    service.get_boxscore(game.gameId, delay=10)

    assert provider.boxscore_calls == 1
