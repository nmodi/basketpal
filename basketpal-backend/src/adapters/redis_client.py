import json
import os
import time
from typing import Any

import redis
from dotenv import load_dotenv

from src.core.entities.game import GameSnapshot
from src.core.ports.storage_client import StorageClient


class RedisClient(StorageClient):
    def __init__(self):
        load_dotenv()
        redis_url = os.environ.get("REDIS_URL")
        self.redis = redis.from_url(redis_url)

    def save_snapshot(self, game: GameSnapshot) -> None:
        key = f"game:{game.gameId}:snapshots"
        now = int(time.time())

        self.redis.zadd(key, {game.model_dump_json(exclude_none=False): now})

    def get_snapshot(self, game_id: str, delay: int = 20) -> GameSnapshot | None:

        key = f"game:{game_id}:snapshots"
        cutoff = int(time.time()) - delay

        result = self.redis.zrevrangebyscore(key, cutoff, 0, start=0, num=1)

        if result is None:
            return None

        json_game = result[0]
        return GameSnapshot.model_validate_json(json_game)

    def save(self, key: str, data: any) -> None:
        self.redis.set(key, json.dumps(data), ex=86400)

    def get(self, key: str) -> any:
        blob = self.redis.get(key)
        if blob:
            return json.loads(blob)
        return None
