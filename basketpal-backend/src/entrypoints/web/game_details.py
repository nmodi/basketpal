
from fastapi import APIRouter

# from src.adapters.chatgpt_content_generator import generate_summary
from src.config.dependencies import content_provider, nba_stats_provider

router = APIRouter(prefix="/games/{game_id}", tags=["Game Details"])


@router.get("/")
async def get_game_by_id(game_id: str):
    return nba_stats_provider.get_boxscore(game_id)


@router.get("/boxscore")
async def get_boxscore(game_id: str):
    print("gameId", game_id)
    return nba_stats_provider.get_boxscore(game_id)


@router.get("/playbyplay")
async def get_playbyplay(game_id: str):
    return nba_stats_provider.get_playbyplay(game_id)


@router.get("/summary")
async def get_summary(game_id: str):
    return content_provider.get_game_summary(game_id)