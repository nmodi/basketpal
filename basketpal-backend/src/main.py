from fastapi import FastAPI

import uvicorn
import os

from src.api import games, game_details

app = FastAPI()

app.include_router(games.router)
app.include_router(game_details.router)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8001))
    host = os.environ.get("HOST", "127.0.0.1")
    uvicorn.run(app, host=host, port=port)
