from datetime import date

from src.core.entities import leagues
from src.core.entities.leagues import League, current_season


def test_current_season_by_league(monkeypatch):
    class FakeDate(date):
        @classmethod
        def today(cls):
            return cls(2026, 8, 17)

    monkeypatch.setattr(leagues, "date", FakeDate)
    assert current_season() == "2025-26"
    assert current_season(League.NBA) == "2025-26"
    assert current_season(League.WNBA) == "2026"

    FakeDate.today = classmethod(lambda cls: cls(2026, 2, 1))
    assert current_season(League.NBA) == "2025-26"
    assert current_season(League.WNBA) == "2025"

    FakeDate.today = classmethod(lambda cls: cls(2026, 11, 1))
    assert current_season(League.NBA) == "2026-27"


def test_from_team_id():
    assert League.from_team_id(1611661320) is League.WNBA
    assert League.from_team_id(1610612744) is League.NBA
