from nba_api.live.nba.endpoints import boxscore

from nba_api.stats.endpoints import playbyplayv2, commonteamroster
from datetime import datetime, date

import requests


def fetch_games(start_dt, end_dt, limit):
    # today = date.today()
    # scores = scoreboardv2.ScoreboardV2(league_id=LeagueID.nba, day_offset=0, game_date=today).get_normalized_dict()
    # season schedule ^
    # season is the year the season started (ex. 2021-22 would be 2021)
    # date is formatted like m/d/yyyy
    # url = "https://stats.nba.com/stats/internationalbroadcasterschedule?LeagueID=00&Season=2022&RegionID=1&Date=11/4/2022&EST=Y"
    # return scoreboard.ScoreBoard().games.get_dict()

    url = "https://cdn.nba.com/static/json/staticData/scheduleLeagueV2_1.json"
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

            filtered.append({
                "gameDate": entry_date,
                "games": entry["games"]
            })

        return filtered


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


def fetch_boxscore(game_id):
    game = boxscore.BoxScore(game_id=game_id).game.get_dict()
    return game


def fetch_playbyplay(game_id):
    return playbyplayv2.PlayByPlayV2(game_id=game_id).get_normalized_dict().get("PlayByPlay")


def fetch_roster(team_id):
    return commonteamroster.CommonTeamRoster(team_id=team_id).get_normalized_dict().get("CommonTeamRoster")
