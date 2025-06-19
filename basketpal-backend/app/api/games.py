
from datetime import timedelta
from fastapi import APIRouter, Query
from typing import Optional

from app.service.nba_service import *

router = APIRouter(prefix="/games", tags=["Games"])


@router.get("/")
async def get_games(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    limit: int = 25
):
    start_dt = datetime.strptime(start_date, "%Y-%m-%d").date() if start_date else None
    end_dt = datetime.strptime(end_date, "%Y-%m-%d").date() if end_date else None
    return fetch_games(start_dt, end_dt, limit)


@router.get("/upcoming")
async def get_upcoming_games(
    limit: int = 25
):
    start_dt = date.today()
    end_dt = start_dt + timedelta(days=5)
    return fetch_games(start_dt, end_dt, limit)


@router.get("/{game_id}")
async def get_game_by_id(game_id: str):
    return fetch_game_by_id(game_id)


@router.get("/{game_id}/boxscore")
async def get_boxscore(game_id: str):
    return fetch_boxscore(game_id)


@router.get("/{game_id}/playbyplay")
async def get_playbyplay(game_id: str):
    return fetch_playbyplay(game_id)
