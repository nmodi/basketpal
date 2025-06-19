import os
from enum import Enum
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()


OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")

if not OPENAI_API_KEY:
    raise RuntimeError("Missing OPENAI_API_KEY environment variable")

client = OpenAI()


class EventMsgType(Enum):
    FIELD_GOAL_MADE = 1
    FIELD_GOAL_MISSED = 2
    FREE_THROW_ATTEMPT = 3
    REBOUND = 4
    TURNOVER = 5
    FOUL = 6
    VIOLATION = 7
    SUBSTITUTION = 8
    TIMEOUT = 9
    JUMP_BALL = 10
    EJECTION = 11
    PERIOD_BEGIN = 12
    PERIOD_END = 13


SKIPPED_EVENT_TYPES = [
    EventMsgType.SUBSTITUTION,
    EventMsgType.VIOLATION,
    EventMsgType.EJECTION,
    EventMsgType.PERIOD_BEGIN,
    EventMsgType.PERIOD_END,
    EventMsgType.JUMP_BALL
]


def generate_summary(play_by_play: list, game, home_roster, visitor_roster):

    cleaned_home_roster = clean_roster(home_roster)
    cleaned_visitor_roster = clean_roster(visitor_roster)
    cleaned_pbp = clean_pbp_data(play_by_play)

    home_team_city = game.get("homeTeam").get("teamCity")
    home_team_name = game.get("homeTeam").get("teamName")
    home_team_score = game.get("homeTeam").get("score")
    home_team = f"{home_team_city} {home_team_name}"

    away_team_city = game.get("awayTeam").get("teamCity")
    away_team_name = game.get("awayTeam").get("teamName")
    away_team_score = game.get("awayTeam").get("score")
    away_team = f"{away_team_city} {away_team_name}"

    response = client.responses.create(
        model="gpt-4.1-mini",
        temperature=0.5,
        input=f"Summarize this game in the style of an ESPN sportswriter:"
              f"Do not add descriptions of players (ex. rookie or college) unless you are 100% sure and "
              f"it's not something that could change over time"
              f"Use only players mentioned in rosters below and the final score below:"
              f"{home_team} roster: {cleaned_home_roster}"
              f"{away_team} roster: {cleaned_visitor_roster}"
              f"The final score was: {home_team}: {home_team_score} to {away_team}: {away_team_score}"
              f"play by play: {cleaned_pbp}"

    )

    return response


def clean_roster(roster):
    players = []
    for player in roster:
        name = player.get("PLAYER")
        players.append(f"{name}")
    return players


def clean_pbp_data(play_by_play: list):
    actions = []
    skipped_play_count = 0

    for play in play_by_play:
        clock = play.get("PCTIMESTRING")
        desc = get_description(play)

        try:
            event_msg_type = EventMsgType(play.get("EVENTMSGTYPE"))
        except ValueError:
            event_msg_type = None

        if event_msg_type in SKIPPED_EVENT_TYPES:
            skipped_play_count += 1
            continue

        actions.append(f"{clock} - {desc}")

    print(f"{skipped_play_count} skipped plays and {len(actions)} plays submitted")
    return actions


def get_description(play: dict):
    return (
        play.get("NEUTRALDESCRIPTION")
        or play.get("HOMEDESCRIPTION")
        or play.get("VISITORDESCRIPTION")
    )
