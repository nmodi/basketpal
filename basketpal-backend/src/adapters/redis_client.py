import json
import os
from datetime import time
from typing import Any

import redis
from dotenv import load_dotenv

from src.core.ports.storage_client import StorageClient


class RedisClient(StorageClient):
    def __init__(self):
        load_dotenv()
        redis_url = os.environ.get("REDIS_URL")
        self.redis = redis.from_url(redis_url)

    def save_snapshot(self, game_id: str, data: dict) -> None:
        key = f"game:{game_id}:states"
        now = int(time.time())

        self.redis.zadd(key, {json.dumps(data): now})

    def get_snapshot(self, game_id: str) -> dict:
        result = self.redis.get(game_id)
        if result is None:
            return {}
        return json.loads(result)

    def save(self, key: str, data: any) -> None:
        self.redis.set(key, json.dumps(data), ex=86400)

    def get(self, key: str) -> any:
        blob = self.redis.get(key)
        if blob:
            return json.loads(blob)
        return None
