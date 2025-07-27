from enum import Enum


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


def format_team_roster(roster):
    players = []
    for player in roster:
        name = player.get("PLAYER")
        players.append(f"{name}")
    return players


def format_pbp(play_by_play: list):
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
