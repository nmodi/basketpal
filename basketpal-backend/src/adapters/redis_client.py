import json
import os
import time
from typing import Any

import redis

# Importing bootstrap loads .env into os.environ at import time.
from src.config.bootstrap import *  # noqa: F401,F403

from src.core.entities.game import GameSnapshot
from src.core.ports.storage_client import StorageClient

DEFAULT_REDIS_URL = "redis://localhost:6379"


class RedisClient(StorageClient):
    def __init__(self):
        redis_url = os.environ.get("REDIS_URL") or DEFAULT_REDIS_URL

        try:
            self.redis = redis.from_url(redis_url)
            # Fail fast during app startup so misconfigured deploys are obvious.
            self.redis.ping()
        except (ValueError, redis.exceptions.RedisError) as exc:
            raise RuntimeError(
                "Redis connection failed. Set REDIS_URL to a valid Redis endpoint. "
                f"Current value: {redis_url}"
            ) from exc

    def save_snapshot(self, game: GameSnapshot) -> None:
        key = f"game:{game.gameId}:snapshots"
        now = int(time.time())

        pipe = self.redis.pipeline()
        pipe.zadd(key, {game.model_dump_json(exclude_none=False): now})
        # Only the delay feature reads history (max 120s lookback); trim the
        # rest and expire the key so finished games don't live in Redis forever.
        pipe.zremrangebyscore(key, "-inf", now - 180)
        pipe.expire(key, 86400)
        pipe.execute()

    def get_snapshot(self, game_id: str, delay: int = 20) -> tuple[GameSnapshot, float] | None:

        key = f"game:{game_id}:snapshots"
        cutoff = int(time.time()) - delay

        result = self.redis.zrevrangebyscore(key, cutoff, 0, withscores=True, start=0, num=1)

        if not result:
            return None

        json_game, score = result[0]
        return GameSnapshot.model_validate_json(json_game), score

    def save(self, key: str, data: any) -> None:
        self.redis.set(key, json.dumps(data), ex=86400)

    def save_with_ttl(self, key: str, data: any, ttl: int) -> None:
        self.redis.set(key, json.dumps(data), ex=ttl)

    def get(self, key: str) -> any:
        blob = self.redis.get(key)
        if blob:
            return json.loads(blob)
        return None
