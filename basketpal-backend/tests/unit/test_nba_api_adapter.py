from datetime import date
from unittest.mock import MagicMock

import pytest
from requests.exceptions import RequestException

from src.adapters.nba_api_adapter import NBAAPIStatsProvider
from src.core.entities.leagues import League


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
