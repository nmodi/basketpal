import os
import redis
from dotenv import load_dotenv

load_dotenv()


def get_redis_client():
    redis_url = os.environ.get("REDIS_URL")

    return redis.from_url(redis_url)
