import logging
import os
from openai import OpenAI

from src.common.formatting_utils import format_team_roster, format_pbp
from src.core.ports import ContentProvider, StorageClient, NBAStatsProvider

logger = logging.getLogger(__name__)


class ChatGPTContentProvider(ContentProvider):
    def __init__(self, storage_client: StorageClient, nba_stats_provider: NBAStatsProvider):
        api_key = os.environ.get("OPENAI_API_KEY")

        if not api_key:
            raise RuntimeError("Missing OPENAI_API_KEY environment variable")

        self.client = OpenAI()
        self.storage_client = storage_client
        self.nba_stats_provider = nba_stats_provider

    def get_game_summary(self, game_id) -> str:
        key = f"game:{game_id}:summary"

        cached = self.storage_client.get(key)
        if cached:
            return cached

        prompt = self.generate_prompt(game_id)
        response = self.client.responses.create(
            model="gpt-4.1-mini",
            temperature=0.5,
            input=prompt
        )
        summary = response.output_text

        self.storage_client.save(key, summary)

        return summary

    def generate_prompt(self, game_id):
        pbp = self.nba_stats_provider.get_playbyplay(game_id)
        game = self.nba_stats_provider.get_boxscore(game_id)

        print(game)

        home_team_id = game.homeTeam.teamId
        visitor_team_id = game.awayTeam.teamId

        try:
            home_roster = self.nba_stats_provider.get_roster(home_team_id)
            away_roster = self.nba_stats_provider.get_roster(visitor_team_id)

            cleaned_home_roster = format_team_roster(home_roster)
            cleaned_visitor_roster = format_team_roster(away_roster)
        except:
            logger.error("Error fetching rosters")

        cleaned_pbp = format_pbp(pbp)

        home_team_city = game.homeTeam.teamCity
        home_team_name = game.homeTeam.teamName
        home_team_score = sum(game.homeTeam.periodScores)
        home_team = f"{home_team_city} {home_team_name}"

        away_team_city = game.awayTeam.teamCity
        away_team_name = game.awayTeam.teamName
        away_team_score = sum(game.awayTeam.periodScores)
        away_team = f"{away_team_city} {away_team_name}"

        return f"Summarize this game in the style of an ESPN sportswriter:"\
               f"Do not add descriptions of players (ex. rookie or college) unless you are 100% sure and "\
               f"it's not something that could change over time"\
               f"Use only players mentioned in rosters below and the final score below:"\
               f"The final score was: {home_team}: {home_team_score} to {away_team}: {away_team_score}"\
               f"play by play: {cleaned_pbp}"

# f"{home_team} roster: {cleaned_home_roster}"\
# f"{away_team} roster: {cleaned_visitor_roster}"\




