from nba_api.live.nba.endpoints import boxscore

from nba_api.stats.endpoints import playbyplayv2, commonteamroster
from datetime import datetime, date

import requests

from src.entities.game import GameSnapshot
from src.entities.leagues import League


# Only works for current season
def fetch_games_dt_range(start_dt, end_dt, league: League):

    url = {
        League.NBA: "https://cdn.nba.com/static/json/staticData/scheduleLeagueV2_1.json",
        League.WNBA: "https://cdn.wnba.com/static/json/staticData/scheduleLeagueV2_1.json"
    }.get(league)

    response = requests.get(url)
    if response.status_code == 200:
        data = response.json()["leagueSchedule"]
        game_dates = data["gameDates"]

        now = date.today()

        filtered = []
        for entry in game_dates:
            entry_date = datetime.strptime(entry["gameDate"], "%m/%d/%Y %H:%M:%S").date()

            if entry_date < now:
                continue
            if start_dt and entry_date < start_dt:
                continue
            if end_dt and entry_date > end_dt:
                continue

            games_on_date = []
            for game_json in entry["games"]:
                game = GameSnapshot.from_api(game_json)
                games_on_date.append(game.dict(exclude_none=True))

            filtered.append({
                "gameDate": entry_date,
                "games": games_on_date
            })

        return filtered


def fetch_todays_games(league: League):
    games_by_date = fetch_games_dt_range(date.today(), date.today(), league)
    return games_by_date[0]["games"]


# Only works in current season
def fetch_game_by_id(game_id: str):
    url = "https://cdn.nba.com/static/json/staticData/scheduleLeagueV2_1.json"
    response = requests.get(url)

    if response.status_code == 200:
        data = response.json()["leagueSchedule"]
        game_dates = data["gameDates"]

        for entry in game_dates:
            for game in entry["games"]:
                if game.get("gameId") == game_id:
                    return game

    return None  # if not found


# Only works for games that have started / finished
def fetch_live_boxscore(game_id):
    game_dict = boxscore.BoxScore(game_id=game_id).game.get_dict()

    game = GameSnapshot.from_api(game_dict)
    return game.dict(exclude_none=True)


def fetch_playbyplay(game_id):
    return playbyplayv2.PlayByPlayV2(game_id=game_id).get_normalized_dict().get("PlayByPlay")


def fetch_roster(team_id):
    return commonteamroster.CommonTeamRoster(team_id=team_id).get_normalized_dict().get("CommonTeamRoster")
