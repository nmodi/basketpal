from fastapi import FastAPI
from nba_service import *

app = FastAPI()


@app.get("/games")
async def get_games():
    return fetch_todays_games()


@app.get("/games/{game_id}/boxscore")
async def get_boxscore(game_id: str):
    return fetch_boxscore(game_id)


@app.get("/games/{game_id}/playbyplay")
async def get_playbyplay(game_id: str):
    return fetch_playbyplay(game_id)

