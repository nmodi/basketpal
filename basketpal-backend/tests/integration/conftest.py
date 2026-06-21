import time

import pytest
from fastapi.testclient import TestClient

from src.entrypoints.web.main import app

SCHEDULED_GAME_ID = "0022401001"
IN_PROGRESS_GAME_ID = "0022401002"
FINAL_GAME_ID = "0022401003"


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as test_client:
        # Let the LeaguePoller's lifespan-started background task run at
        # least one poll cycle so a snapshot exists for the in-progress game.
        time.sleep(0.5)
        yield test_client
