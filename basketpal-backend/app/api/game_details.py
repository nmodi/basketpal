
from fastapi import APIRouter

from app.service.ai_service import generate_summary
from app.service.nba_service import *

router = APIRouter(prefix="/games/{game_id}", tags=["Game Details"])


@router.get("/")
async def get_game_by_id(game_id: str):
    return fetch_game_by_id(game_id)


@router.get("/boxscore")
async def get_boxscore(game_id: str):
    return fetch_boxscore(game_id)


@router.get("/playbyplay")
async def get_playbyplay(game_id: str):
    return fetch_playbyplay(game_id)


@router.get("/summary")
async def get_playbyplay(game_id: str):
    pbp = fetch_playbyplay(game_id)
    # game = fetch_game_by_id(game_id)

    game_boxscore = fetch_boxscore(game_id)

    home_team_id = game_boxscore.get("homeTeam").get("teamId")
    visitor_team_id = game_boxscore.get("awayTeam").get("teamId")

    home_roster = fetch_roster(home_team_id)
    vistor_roster = fetch_roster(visitor_team_id)

    return generate_summary(pbp,
                            game_boxscore,
                            home_roster,
                            vistor_roster)