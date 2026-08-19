
from datetime import timedelta, date, datetime
from fastapi import APIRouter, HTTPException, Query
from requests.exceptions import RequestException
from typing import Optional

from src.config.logger import get_logger
from src.core.entities.leagues import League
from src.config.dependencies import nba_stats_provider

logger = get_logger(__name__)

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

    try:
        return nba_stats_provider.get_games_dt_range(start_dt, end_dt, league_value)
    except (RequestException, KeyError) as exc:
        # Provider unreachable and no stale copy to serve — degrade to an empty
        # schedule so the index renders "no games" instead of a 500 page.
        logger.warning(f"Schedule unavailable for {league_value}: {exc}")
        return []
