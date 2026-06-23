import os

# Importing bootstrap loads .env into os.environ. Must run before any module
# reads env vars at import time. Kept here too so non-entrypoint import paths
# (e.g. tests importing dependencies directly) still load .env first.
from src.config.bootstrap import *  # noqa: F401,F403

from src.core.application.nba_stats_service import NBAStatsService
from src.core.application.league_poller import LeaguePoller
from src.core.entities.leagues import League
from src.core.ports import StorageClient, ContentProvider, NBAStatsProvider, InjuriesProvider

if os.environ.get("MOCK_DATA", "").lower() in ("1", "true", "yes"):
    from src.adapters.mock_adapter import MockNBAStatsProvider, NullStorageClient, MockContentProvider, MockInjuriesProvider

    storage_client: StorageClient = NullStorageClient()
    nba_stats_provider: NBAStatsProvider = MockNBAStatsProvider()
    injuries_provider: InjuriesProvider = MockInjuriesProvider()
    content_provider: ContentProvider = MockContentProvider()
else:
    from src.adapters import RedisClient, OpenRouterContentProvider, NBAAPIStatsProvider, ESPNInjuriesProvider

    storage_client: StorageClient = RedisClient()
    nba_stats_provider: NBAStatsProvider = NBAAPIStatsProvider()
    injuries_provider: InjuriesProvider = ESPNInjuriesProvider()
    content_provider: ContentProvider = OpenRouterContentProvider(storage_client, nba_stats_provider, injuries_provider)

nba_service = NBAStatsService(nba_stats_provider, storage_client)
nba_poller = LeaguePoller(storage_client, nba_service, League.NBA)
# wnba_poller = LeaguePoller(storage_client, nba_service, League.WNBA)
