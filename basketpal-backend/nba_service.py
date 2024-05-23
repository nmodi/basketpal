from nba_api.live.nba.endpoints import scoreboard
from nba_api.live.nba.endpoints import boxscore
from nba_api.live.nba.endpoints import playbyplay

from nba_api.stats.endpoints import playbyplayv2
from nba_api.stats.endpoints import scoreboardv2
from nba_api.stats.library.parameters import LeagueID
from datetime import date


def fetch_todays_games():
    # today = date.today()
    # scores = scoreboardv2.ScoreboardV2(league_id=LeagueID.nba, day_offset=0, game_date=today).get_normalized_dict()

    return scoreboard.ScoreBoard().games.get_dict()


def fetch_boxscore(game_id):
    game = boxscore.BoxScore(game_id=game_id).game.get_dict()
    return game


def fetch_playbyplay(game_id):
    return playbyplay.PlayByPlay(game_id=game_id).get_dict()


def future_boxscore(game_id):
    return playbyplayv2.PlayByPlayV2(game_id=game_id).get_dict()