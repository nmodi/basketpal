
from fastapi import APIRouter

from src.service.ai_service import generate_summary
from src.service.nba_service import *

router = APIRouter(prefix="/games/{game_id}", tags=["Game Details"])


@router.get("/")
async def get_game_by_id(game_id: str):
    return fetch_game_by_id(game_id)


@router.get("/boxscore")
async def get_boxscore(game_id: str):
    return fetch_live_boxscore(game_id)


@router.get("/playbyplay")
async def get_playbyplay(game_id: str):
    return fetch_playbyplay(game_id)


@router.get("/summary")
async def get_summary(game_id: str):
    return generate_summary(game_id)