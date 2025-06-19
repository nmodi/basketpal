import os

try:
    import redis
except ImportError:
    redis = None

try:
    import fakeredis
except ImportError:
    fakeredis = None


def get_redis_client():
    redis_url = os.environ.get("REDIS_URL")

    if redis_url:
        return redis.from_url(redis_url)
    else:
        if fakeredis:
            return fakeredis.FakeStrictRedis()
        else:
            raise RuntimeError("fakeredis not installed and no REDIS_URL found")
