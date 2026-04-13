from dotenv import load_dotenv

from src.adapters import RedisClient, ChatGPTContentProvider, NBAAPIStatsProvider
from src.core.application.nba_stats_service import NBAStatsService
from src.core.application.league_poller import LeaguePoller
from src.core.entities.leagues import League
from src.core.ports import StorageClient, ContentProvider, NBAStatsProvider

load_dotenv()

storage_client: StorageClient = RedisClient()
nba_stats_provider: NBAStatsProvider = NBAAPIStatsProvider()
content_provider: ContentProvider = ChatGPTContentProvider(storage_client, nba_stats_provider)
nba_service = NBAStatsService(nba_stats_provider, storage_client)
nba_poller = LeaguePoller(storage_client, nba_service, League.NBA)
# wnba_poller = LeaguePoller(storage_client, nba_service, League.WNBA)
