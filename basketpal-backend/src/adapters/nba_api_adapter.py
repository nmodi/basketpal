import logging

from nba_api.live.nba.endpoints import boxscore as boxscore
# from nba_api.live.wnba.endpoints import boxscore as wnba_boxscore  # TODO: pending nba_api PR

from nba_api.stats.endpoints import playbyplayv2, commonteamroster
from datetime import datetime, date

import requests

logger = logging.getLogger(__name__)

from src.core.entities.game import GameSnapshot, GameStatus
from src.core.entities.leagues import League
from src.core.ports.nba_stats_provider import NBAStatsProvider


class NBAAPIStatsProvider(NBAStatsProvider):

    # Only works for current season
    def get_games_dt_range(self, start_dt, end_dt, league: League):

        url = _get_schedule_url(league)

        response = requests.get(url)
        if response.status_code == 200:
            data = response.json()["leagueSchedule"]
            game_dates = data["gameDates"]

            filtered = []
            for entry in game_dates:
                entry_date = datetime.strptime(entry["gameDate"], "%m/%d/%Y %H:%M:%S").date()

                if start_dt and entry_date < start_dt:
                    continue
                if end_dt and entry_date > end_dt:
                    continue

                games_on_date = []
                for game_json in entry["games"]:
                    game = GameSnapshot.from_api(game_json)
                    games_on_date.append(game)

                filtered.append({
                    "gameDate": entry_date,
                    "games": games_on_date
                })

            return filtered

    def get_boxscore(self, game_id: str):

        game = _get_boxscore_from_schedule(game_id)

        if game is None or game.gameStatus != GameStatus.SCHEDULED:
            league = League.NBA if game_id.startswith("00") else League.WNBA
            if league is League.NBA:
                game_dict = boxscore.BoxScore(game_id=game_id).game.get_dict()
            else:
                pass  # TODO: wnba_boxscore.BoxScore(game_id=game_id).game.get_dict() — pending nba_api PR

            game = GameSnapshot.from_api(game_dict)
            return game

        return game

    def get_playbyplay(self, game_id):
        try:
            return playbyplayv2.PlayByPlayV2(game_id=game_id).get_normalized_dict().get("PlayByPlay") or []
        except KeyError:
            logger.warning(f"Play-by-play data unavailable for game {game_id}")
            return []

    def get_roster(self, team_id):
        return commonteamroster.CommonTeamRoster(team_id=team_id).get_normalized_dict().get("CommonTeamRoster")


def _get_schedule_url(league: League):
    url = {
        League.NBA: "https://cdn.nba.com/static/json/staticData/scheduleLeagueV2_1.json",
        League.WNBA: "https://cdn.wnba.com/static/json/staticData/scheduleLeagueV2_1.json"
    }.get(league)

    return url


def _get_boxscore_from_schedule(game_id):
    league = League.NBA if game_id.startswith("00") else League.WNBA
    url = _get_schedule_url(league)

    response = requests.get(url)
    if response.status_code == 200:
        data = response.json()["leagueSchedule"]
        game_dates = data["gameDates"]

        for entry in game_dates:
            for game_dict in entry["games"]:
                if game_dict.get("gameId") == game_id:
                    return GameSnapshot.from_api(game_dict)

    return None

