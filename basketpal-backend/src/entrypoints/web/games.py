
from datetime import timedelta, date, datetime
from fastapi import APIRouter, HTTPException, Query
from typing import Optional

from src.core.entities.leagues import League
from src.config.dependencies import nba_stats_provider

router = APIRouter(prefix="/games", tags=["Games"])


@router.get("/upcoming")
def get_upcoming_games(
    league: str = None,
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
):

    if league is None:
        league_value = League.NBA
    else:
        try:
            league_value = League.from_code(league)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Unknown league: {league}")

    start_dt = datetime.strptime(start_date, "%Y-%m-%d").date() if start_date else date.today()
    end_dt = datetime.strptime(end_date, "%Y-%m-%d").date() if end_date else start_dt + timedelta(days=13)

    return nba_stats_provider.get_games_dt_range(start_dt, end_dt, league_value)
