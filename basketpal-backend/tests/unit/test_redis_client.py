import time

import fakeredis
import pytest

from src.adapters.redis_client import RedisClient
from src.core.entities.game import GameStatus


@pytest.fixture
def redis_client(monkeypatch, snapshot_factory):
    fake = fakeredis.FakeStrictRedis()
    monkeypatch.setattr("src.adapters.redis_client.redis.from_url", lambda *_a, **_kw: fake)
    return RedisClient()


def test_get_snapshot_returns_none_when_no_snapshots_saved(redis_client):
    """Regression for H2: zrevrangebyscore on an empty key returns an empty
    list (never None), and indexing it used to raise IndexError."""
    assert redis_client.get_snapshot("no-such-game", delay=10) is None


def test_get_snapshot_returns_none_when_only_a_too_fresh_snapshot_exists(redis_client, snapshot_factory):
    """get_snapshot(delay=N) should only return snapshots at least N seconds
    old; a just-saved snapshot doesn't qualify yet."""
    game = snapshot_factory(status=GameStatus.IN_PROGRESS)
    redis_client.save_snapshot(game)

    assert redis_client.get_snapshot(game.gameId, delay=10) is None


def test_get_snapshot_returns_snapshot_and_unix_score_once_old_enough(redis_client, snapshot_factory):
    game = snapshot_factory(status=GameStatus.IN_PROGRESS)
    key = f"game:{game.gameId}:snapshots"
    old_score = time.time() - 20
    redis_client.redis.zadd(key, {game.model_dump_json(exclude_none=False): old_score})

    result = redis_client.get_snapshot(game.gameId, delay=10)

    assert result is not None
    snapshot, score = result
    assert snapshot.gameId == game.gameId
    assert score == pytest.approx(old_score)
