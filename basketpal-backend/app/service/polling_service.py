import asyncio
import time
from datetime import datetime, timedelta
from app.timeline import manager

from app.service import nba_service

# Polling intervals in seconds
POLL_INTERVALS = {
    "scheduled_far": 300,      # 5 minutes if game >15 min away
    "scheduled_soon": 30,      # 30s if within 15 min
    "in_progress": 5,          # live game
    "final": None              # do not poll
}

# Tracks when we last polled each game
last_polled = {}

def should_poll(game_id, game_status, start_time):
    now = time.time()
    last = last_polled.get(game_id, 0)

    if game_status == "final":
        return False

    if game_status == "in_progress":
        return now - last >= POLL_INTERVALS["in_progress"]

    if game_status == "scheduled":
        start_dt = datetime.fromisoformat(start_time)
        time_to_tipoff = (start_dt - datetime.utcnow()).total_seconds()

        if time_to_tipoff < 0:
            # Game may have just started but not updated yet
            return now - last >= POLL_INTERVALS["scheduled_soon"]
        elif time_to_tipoff <= 900:
            # Within 15 minutes
            return now - last >= POLL_INTERVALS["scheduled_soon"]
        else:
            return now - last >= POLL_INTERVALS["scheduled_far"]

    return False

async def poll_game(game_id):
    try:
        game_data = nba_api.fetch_game_snapshot(game_id)
        manager.append_snapshot(game_id, game_data)
        last_polled[game_id] = time.time()
    except Exception as e:
        print(f"[{game_id}] Poll error: {e}")


async def polling_loop():
    while True:
        try:
            all_games = nba_service.fetch_todays_games()  # returns [{id, status, start_time}, ...]

            tasks = []
            for game in all_games:
                game_id = game["id"]
                status = game["status"]         # "scheduled", "in_progress", "final"
                start_time = game["start_time"] # ISO format: "2025-06-15T23:00:00Z"

                if should_poll(game_id, status, start_time):
                    tasks.append(poll_game(game_id))

            if tasks:
                await asyncio.gather(*tasks)

            await asyncio.sleep(5)  # Main loop cycle
        except Exception as e:
            print(f"[poller] Error: {e}")
            await asyncio.sleep(10)

if __name__ == "__main__":
    print("🏀 Smart Poller started")
    asyncio.run(polling_loop())
