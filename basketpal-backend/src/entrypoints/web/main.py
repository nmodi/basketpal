# Side-effect import: load .env before any other src.* module reads env vars
# at import time. Must stay first.
from src.config.bootstrap import *  # noqa: F401,F403
import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import uvicorn
import os

from src.config.dependencies import nba_poller, wnba_poller
from src.entrypoints.web.games import router as games_router
from src.entrypoints.web.game_details import router as game_details_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    nba_task = asyncio.create_task(nba_poller.start())
    wnba_task = asyncio.create_task(wnba_poller.start())
    yield
    await nba_poller.stop()
    await wnba_poller.stop()
    nba_task.cancel()
    wnba_task.cancel()
    for task in [nba_task, wnba_task]:
        try:
            await task
        except asyncio.CancelledError:
            pass
    print("Polling loops stopped.")


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

app.include_router(games_router)
app.include_router(game_details_router)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8001))
    host = os.environ.get("HOST", "127.0.0.1")
    uvicorn.run(app, host=host, port=port)
