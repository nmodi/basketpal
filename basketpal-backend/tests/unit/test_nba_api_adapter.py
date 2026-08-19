from datetime import date
from unittest.mock import MagicMock

import pytest
from requests.exceptions import RequestException

from src.adapters import nba_api_adapter
from src.adapters.nba_api_adapter import NBAAPIStatsProvider
from src.core.entities.leagues import League


@pytest.fixture(autouse=True)
def _reset_schedule_state():
    # _load_schedule keeps module-level state (in-memory cache + stale store);
    # reset it so tests don't leak into each other.
    nba_api_adapter._schedule_cache.clear()
    nba_api_adapter.set_schedule_store(None)
    yield
    nba_api_adapter._schedule_cache.clear()
    nba_api_adapter.set_schedule_store(None)


class FakeStore:
    """StorageClient stand-in; real RedisClient JSON round-trips values, which
    is an identity transform for the strings the schedule cache stores."""

    def __init__(self):
        self.data = {}

    def save_with_ttl(self, key, data, ttl):
        self.data[key] = data

    def get(self, key):
        return self.data.get(key)


def test_load_schedule_serves_stale_copy_when_fetch_fails(monkeypatch):
    store = FakeStore()
    nba_api_adapter.set_schedule_store(store)
    game_dates = [{"gameDate": "10/21/2025 00:00:00 AM", "games": []}]
    nba_api_adapter._save_stale_schedule(League.NBA, game_dates)

    monkeypatch.setattr(
        "src.adapters.nba_api_adapter.requests.get",
        MagicMock(return_value=MagicMock(status_code=403)),
    )

    assert nba_api_adapter._load_schedule(League.NBA) == game_dates


def test_load_schedule_raises_when_fetch_fails_and_no_stale_copy(monkeypatch):
    nba_api_adapter.set_schedule_store(FakeStore())
    monkeypatch.setattr(
        "src.adapters.nba_api_adapter.requests.get",
        MagicMock(return_value=MagicMock(status_code=403)),
    )

    with pytest.raises(RequestException):
        nba_api_adapter._load_schedule(League.NBA)


def test_get_games_dt_range_raises_on_non_200(monkeypatch):
    """Regression for L5: a non-200 schedule response used to fall through
    silently and return None instead of signalling an error."""
    response = MagicMock(status_code=503)
    monkeypatch.setattr(
        "src.adapters.nba_api_adapter.requests.get",
        MagicMock(return_value=response),
    )

    provider = NBAAPIStatsProvider()

    with pytest.raises(RequestException):
        provider.get_games_dt_range(date.today(), date.today(), League.NBA)


def test_get_games_dt_range_passes_explicit_timeout(monkeypatch):
    response = MagicMock(status_code=503)
    get = MagicMock(return_value=response)
    monkeypatch.setattr("src.adapters.nba_api_adapter.requests.get", get)

    provider = NBAAPIStatsProvider()
    with pytest.raises(RequestException):
        provider.get_games_dt_range(date.today(), date.today(), League.NBA)

    _, kwargs = get.call_args
    assert kwargs.get("timeout") is not None
