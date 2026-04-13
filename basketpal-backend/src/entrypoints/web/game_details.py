
import traceback
from fastapi import APIRouter

# from src.adapters.chatgpt_content_generator import generate_summary
from src.config.dependencies import content_provider, nba_service

router = APIRouter(prefix="/games/{game_id}", tags=["Game Details"])


@router.get("/")
async def get_game_by_id(game_id: str, delay: int = None):
    return nba_service.get_boxscore(game_id, delay)


@router.get("/boxscore")
async def get_boxscore(game_id: str, delay: int = None):
    return nba_service.get_boxscore(game_id, delay)


@router.get("/playbyplay")
async def get_playbyplay(game_id: str):
    return nba_service.get_playbyplay(game_id)


@router.get("/summary")
async def get_summary(game_id: str):
    try:
        return content_provider.get_game_summary(game_id)
    except Exception:
        traceback.print_exc()
        raise
