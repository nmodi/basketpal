from fastapi import FastAPI

import uvicorn
import os

from src.entrypoints.web.games import router as games_router
from src.entrypoints.web.game_details import router as game_details_router

# from .games import router as games_router
# from .game_details import router as game_details_router

app = FastAPI()

app.include_router(games_router)
app.include_router(game_details_router)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8001))
    host = os.environ.get("HOST", "127.0.0.1")
    uvicorn.run(app, host=host, port=port)
