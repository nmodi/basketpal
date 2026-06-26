import re

# Categories dropped outright (opening tip and the final free throw of a trip
# are handled separately since they're conditional, not blanket removals).
_REMOVABLE_ACTION_TYPES = {"Substitution", "Timeout", "Instant Replay"}

_CLOCK_RE = re.compile(r"PT(\d+)M([\d.]+)S")
_FT_TRIP_RE = re.compile(r"Free Throw (\d+) of (\d+)")


def format_team_roster(roster):
    return [p.get("PLAYER") for p in roster]


_MIN_RUN_POINTS = 8  # threshold for structured run objects surfaced to the prompt


def format_pbp(play_by_play: list):
    """Compress playbyplayv3 actions into short, narrative-relevant events,
    and extract structured scoring-run records.

    Routine noise (subs, timeouts, replay reviews, non-opening jump balls,
    and all but the last free throw of a trip) is dropped, unless the event
    coincides with a lead change, a tie, a 6+ unanswered-point run, or it
    falls in the final 2 minutes of the 4th quarter / any overtime period —
    those are always kept regardless of category.

    Each returned event carries a "tags" list (any of "lead_change", "tie",
    "run", "clutch") marking which of those conditions applied, so callers
    can pull out pre-flagged plays without re-deriving them from scores. The
    6+ bar here drives PBP compression only.

    The second return value is a list of structured scoring-run objects for
    runs of _MIN_RUN_POINTS (8+) or more unanswered points — these are handed
    to the content-generation prompt as ground-truth context. Each run is
    {team, points, scoreBefore, startQ, startTime, endQ, endTime, players}.

    Returns (events, runs).
    """
    events = []
    runs = []

    prev_home, prev_away, prev_diff = 0, 0, 0
    run_team, run_points = None, 0
    run_start_q, run_start_t, run_start_home, run_start_away = None, None, 0, 0
    run_last_q, run_last_t = None, None
    run_players = []
    seen_jump_ball = False

    def _close_run():
        # Seal the in-progress run (called when the opponent scores, ending it,
        # and once more after the loop for a run still live at the final buzzer).
        if run_team is not None and run_points >= _MIN_RUN_POINTS:
            runs.append({
                "team": run_team,
                "points": run_points,
                "scoreBefore": f"{run_start_away}-{run_start_home}",
                "startQ": run_start_q,
                "startTime": run_start_t,
                "endQ": run_last_q,
                "endTime": run_last_t,
                "players": run_players,
            })

    for action in play_by_play:
        action_type = action.get("actionType") or ""
        sub_type = (action.get("subType") or "").strip()
        period = action.get("period") or 1
        minutes, seconds = _parse_clock(action.get("clock"))
        clock = f"{minutes:02d}:{seconds:02d}"

        is_lead_change = is_tie = is_run = False

        score_home_raw = action.get("scoreHome")
        score_away_raw = action.get("scoreAway")
        if score_home_raw not in (None, "") and score_away_raw not in (None, ""):
            new_home, new_away = int(score_home_raw), int(score_away_raw)
            new_diff = new_home - new_away

            is_tie = new_diff == 0
            is_lead_change = new_diff != 0 and (prev_diff > 0) != (new_diff > 0)

            points_scored = (new_home + new_away) - (prev_home + prev_away)
            if points_scored > 0:
                scoring_team = action.get("teamTricode") or action.get("teamId")
                scorer = action.get("playerName") or ""
                if scoring_team == run_team:
                    run_points += points_scored
                    run_last_q, run_last_t = period, clock
                    if scorer and scorer not in run_players:
                        run_players.append(scorer)
                else:
                    # Opponent scored: the prior run (if any) is over. Seal it
                    # at its own last play, then open a new run by this team.
                    _close_run()
                    run_team = scoring_team
                    run_points = points_scored
                    run_start_q, run_start_t = period, clock
                    run_start_home, run_start_away = prev_home, prev_away
                    run_last_q, run_last_t = period, clock
                    run_players = [scorer] if scorer else []
                is_run = run_points >= 6

            prev_home, prev_away, prev_diff = new_home, new_away, new_diff

        is_crunch_time = period > 4 or (period == 4 and minutes * 60 + seconds <= 120)
        must_preserve = is_lead_change or is_tie or is_run or is_crunch_time

        is_opening_jump_ball = action_type == "Jump Ball" and not seen_jump_ball
        if action_type == "Jump Ball":
            seen_jump_ball = True

        removable = (
            action_type in _REMOVABLE_ACTION_TYPES
            or (action_type == "Jump Ball" and not is_opening_jump_ball)
            or (action_type == "Free Throw" and not _is_final_free_throw(sub_type))
        )

        if removable and not must_preserve:
            continue

        tags = []
        if is_lead_change:
            tags.append("lead_change")
        if is_tie:
            tags.append("tie")
        if is_run:
            tags.append("run")
        if is_crunch_time:
            tags.append("clutch")

        events.append({
            "q": period,
            "t": clock,
            "team": action.get("teamTricode") or "",
            "player": action.get("playerName") or "",
            "event": _describe_event(action, is_opening_jump_ball),
            "score": f"{prev_away}-{prev_home}",
            "tags": tags,
        })

    # A run may still be live at the final buzzer — seal it once more.
    _close_run()

    return events, runs


def format_period_scores(home_team: str, home_period_scores: list, away_team: str, away_period_scores: list):
    lines = []
    for i, (home_score, away_score) in enumerate(zip(home_period_scores, away_period_scores), start=1):
        period_label = f"Q{i}" if i <= 4 else f"OT{i - 4}"
        lines.append(f"{period_label}: {home_team} {home_score}, {away_team} {away_score}")
    return "\n".join(lines)


def _parse_clock(clock: str):
    match = _CLOCK_RE.match(clock or "")
    if not match:
        return 0, 0
    return int(match.group(1)), int(float(match.group(2)))


def _is_final_free_throw(sub_type: str) -> bool:
    match = _FT_TRIP_RE.search(sub_type or "")
    if not match:
        return True
    return match.group(1) == match.group(2)


def _shot_label(action: dict) -> str:
    label = (action.get("subType") or "shot").strip().lower()
    if not label.endswith("shot"):
        label = f"{label} shot"
    if action.get("shotValue") == 3:
        label = f"3pt {label}"
    return label


def _describe_event(action: dict, is_opening_jump_ball: bool = False) -> str:
    action_type = action.get("actionType") or ""
    sub_type = (action.get("subType") or "").strip()
    desc = action.get("description") or ""

    if action_type == "Made Shot":
        return f"Makes {_shot_label(action)}"
    if action_type == "Missed Shot":
        return f"Misses {_shot_label(action)}"
    if action_type == "Free Throw":
        return "Misses free throw" if desc.startswith("MISS") else "Makes free throw"
    if action_type == "Rebound":
        return "Grabs rebound"
    if action_type == "Turnover":
        return "Turns the ball over"
    if action_type == "Foul":
        return f"Commits {sub_type.lower() or 'personal'} foul"
    if action_type == "Violation":
        return f"Commits {sub_type.lower() or 'rule'} violation"
    if action_type == "Jump Ball":
        return "Wins opening tip" if is_opening_jump_ball else "Wins jump ball"
    if action_type == "Substitution":
        return "Substitutes into the game"
    if action_type == "Timeout":
        return "Calls timeout"
    if action_type == "Instant Replay":
        return "Reviews the call"

    upper_desc = desc.upper()
    if "STEAL" in upper_desc:
        return "Steals the ball"
    if "BLOCK" in upper_desc:
        return "Blocks the shot"

    return re.sub(r"\([^)]*\)", "", desc).strip() or "Game event"
