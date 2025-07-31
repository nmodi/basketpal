import asyncio
import time
from datetime import date

from src.config.logger import get_logger
from src.core.application.nba_stats_service import NBAStatsService
from src.core.entities.game import GameStatus, GameSnapshot
from src.core.entities.leagues import League
from src.core.ports import StorageClient

logger = get_logger(__name__)


class LeaguePoller:
    def __init__(self,
                 storage_client: StorageClient,
                 stats_service: NBAStatsService,
                 league: League,
                 interval_seconds: int = 10):

        self._storage_client = storage_client
        self._stats_service = stats_service
        self._league = league

        self._interval_seconds = interval_seconds
        self._last_polled = {}
        self._todays_date = None
        self._todays_games = []
        self._running = False

    async def start(self):
        self._running = True
        self._todays_games = self._stats_service.get_todays_games(self._league)
        self._todays_date = date.today()

        while self._running:
            try:
                await self.poll_league()
                await asyncio.sleep(self._interval_seconds)
            except Exception as e:
                logger.exception(f"Error in polling loop: {e}")
                break

    async def stop(self):
        self._running = False

    async def poll_league(self):
        if date.today() != self._todays_date:
            self._todays_games = self._stats_service.get_todays_games(self._league)
            self._todays_date = date.today()

        logger.debug("Polling league")

        for game in self._todays_games:
            await self.poll_game(game)

    async def poll_game(self, game: GameSnapshot):
        if self._should_poll_game(game.gameId, game.gameStatus):

            logger.debug(f"Polling game: {game.gameId}")

            game = self._stats_service.get_boxscore(game.gameId)
            self._last_polled[game.gameId] = time.time()

            if game.gameStatus is GameStatus.IN_PROGRESS:
                self._storage_client.save_snapshot(game)

    def _should_poll_game(self, game_id, game_status: GameStatus):
        now = time.time()
        last = self._last_polled.get(game_id, 0)

        time_since_last_poll = now - last

        logger.debug(f"Checking if should poll game {game_id} with status {game_status}. Last polled at {last} ({time_since_last_poll} s ago)")

        match game_status:
            case GameStatus.SCHEDULED:
                return time_since_last_poll >= 60

            case GameStatus.IN_PROGRESS:
                return time_since_last_poll >= 10

            case GameStatus.FINAL:
                return False

            case _:
                return False
