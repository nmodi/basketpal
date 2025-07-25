import json
import os
from openai import OpenAI
from dotenv import load_dotenv

from src.service.nba_service import fetch_playbyplay, fetch_live_boxscore, fetch_roster
from src.storage.redis_client import get_redis_client
from src.util.formatting_utils import format_team_roster, format_pbp

load_dotenv()


OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")

if not OPENAI_API_KEY:
    raise RuntimeError("Missing OPENAI_API_KEY environment variable")

client = OpenAI()


def generate_summary(game_id):

    key = f"game:{game_id}:summary"

    cached = get_redis_client().get(key)
    if cached:
        return json.loads(cached)

    prompt = generate_prompt(game_id)
    response = client.responses.create(
        model="gpt-4.1-mini",
        temperature=0.5,
        input=prompt
    )
    summary = response.output_text

    get_redis_client().set(key, json.dumps(summary), ex=86400)

    return summary


def generate_prompt(game_id):
    pbp = fetch_playbyplay(game_id)
    game = fetch_live_boxscore(game_id)

    home_team_id = game.get("homeTeam").get("teamId")
    visitor_team_id = game.get("awayTeam").get("teamId")

    home_roster = fetch_roster(home_team_id)
    away_roster = fetch_roster(visitor_team_id)

    cleaned_home_roster = format_team_roster(home_roster)
    cleaned_visitor_roster = format_team_roster(away_roster)
    cleaned_pbp = format_pbp(pbp)

    home_team_city = game.get("homeTeam").get("teamCity")
    home_team_name = game.get("homeTeam").get("teamName")
    home_team_score = game.get("homeTeam").get("score")
    home_team = f"{home_team_city} {home_team_name}"

    away_team_city = game.get("awayTeam").get("teamCity")
    away_team_name = game.get("awayTeam").get("teamName")
    away_team_score = game.get("awayTeam").get("score")
    away_team = f"{away_team_city} {away_team_name}"

    return f"Summarize this game in the style of an ESPN sportswriter:"\
           f"Do not add descriptions of players (ex. rookie or college) unless you are 100% sure and "\
           f"it's not something that could change over time"\
           f"Use only players mentioned in rosters below and the final score below:"\
           f"{home_team} roster: {cleaned_home_roster}"\
           f"{away_team} roster: {cleaned_visitor_roster}"\
           f"The final score was: {home_team}: {home_team_score} to {away_team}: {away_team_score}"\
           f"play by play: {cleaned_pbp}"




