from dotenv import load_dotenv

from src.adapters import RedisClient, ChatGPTContentProvider, NBAAPIStatsProvider
from src.core.ports import StorageClient, ContentProvider, NBAStatsProvider

load_dotenv()

storage_client: StorageClient = RedisClient()
nba_stats_provider: NBAStatsProvider = NBAAPIStatsProvider()
content_provider: ContentProvider = ChatGPTContentProvider(storage_client, nba_stats_provider)
