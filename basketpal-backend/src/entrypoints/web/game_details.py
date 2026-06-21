
import traceback
from fastapi import APIRouter, HTTPException
from requests.exceptions import RequestException

from src.config.dependencies import content_provider, nba_service

router = APIRouter(prefix="/games/{game_id}", tags=["Game Details"])


def _get_boxscore_or_error(game_id: str, delay: int = None):
    try:
        return nba_service.get_boxscore(game_id, delay)
    except ValueError:
        # No data for this id (invalid / not yet played).
        raise HTTPException(status_code=404, detail=f"Game {game_id} not found")
    except (RequestException, KeyError) as exc:
        # Upstream NBA provider unreachable/changed (e.g. stats.nba.com timeout,
        # blocked network, or unexpected payload shape).
        traceback.print_exc()
        raise HTTPException(status_code=502, detail=f"NBA stats provider unavailable for game {game_id}") from exc


@router.get("/")
async def get_game_by_id(game_id: str, delay: int = None):
    return _get_boxscore_or_error(game_id, delay)


@router.get("/boxscore")
async def get_boxscore(game_id: str, delay: int = None):
    return _get_boxscore_or_error(game_id, delay)


@router.get("/playbyplay")
async def get_playbyplay(game_id: str):
    return nba_service.get_playbyplay(game_id)


@router.get("/summary")
async def get_summary(game_id: str, refresh: bool = False):
    try:
        return content_provider.get_game_summary(game_id, force_refresh=refresh)
    except Exception:
        traceback.print_exc()
        raise


@router.get("/model-comparison")
async def get_model_comparison(game_id: str, refresh: bool = False):
    try:
        return content_provider.get_model_comparison(game_id, force_refresh=refresh)
    except NotImplementedError:
        raise HTTPException(status_code=501, detail="Model comparison is not supported by the active content provider")
    except Exception:
        traceback.print_exc()
        raise
