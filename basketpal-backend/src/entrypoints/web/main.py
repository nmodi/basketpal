import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI

import uvicorn
import os

from src.config.dependencies import nba_poller
from src.entrypoints.web.games import router as games_router
from src.entrypoints.web.game_details import router as game_details_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(nba_poller.start())
    yield
    await nba_poller.stop()
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        print("Polling loop stopped.")


app = FastAPI(lifespan=lifespan)

app.include_router(games_router)
app.include_router(game_details_router)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8001))
    host = os.environ.get("HOST", "127.0.0.1")
    uvicorn.run(app, host=host, port=port)
