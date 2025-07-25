import asyncio
import json
import time
from datetime import datetime, date

from src.entities.game import GameStatus
from src.service import nba_service
from src.storage.redis_client import get_redis_client

# Tracks when we last polled each game
last_polled = {}


def should_poll(game_id, game_status, start_time):
    now = time.time()
    last = last_polled.get(game_id, 0)

    if game_status == GameStatus.FINAL.value:
        return False

    if game_status == GameStatus.IN_PROGRESS.value:
        return now - last >= 5

    if game_status == GameStatus.SCHEDULED.value:
        start_dt = datetime.fromisoformat(start_time)
        time_to_tipoff = (start_dt - datetime.now()).total_seconds()

        if time_to_tipoff < 0:
            # Game may have just started but not updated yet
            return now - last >= 10
        elif time_to_tipoff <= 900:
            # Within 15 minutes
            return now - last >= 30
        else:
            return now - last >= 120

    return False


async def poll_game(game_id):
    key = f"game:{game_id}:states"

    game_data = nba_service.fetch_game_by_id(game_id)
    now = int(time.time())

    game_status = game_data.get("gameStatus")

    last_polled[game_id] = now

    if game_status == GameStatus.IN_PROGRESS.value:
        game_data = nba_service.fetch_live_boxscore(game_id)
        get_redis_client().zadd(key, {json.dumps(game_data): now})

        print(f"polled game - {game_id}")


async def polling_loop():
    while True:

        all_games = nba_service.fetch_todays_games()

        tasks = []
        for game in all_games:

            game_id = game.get("gameId")
            status = game.get("gameStatus")
            start_time = game.get("gameDateTimeUTC")

            if should_poll(game_id, status, start_time):
                tasks.append(poll_game(game_id))

        if tasks:
            await asyncio.gather(*tasks)

        await asyncio.sleep(5)  # Main loop cycle

if __name__ == "__main__":
    print("🏀 Smart Poller started")
    asyncio.run(polling_loop())
