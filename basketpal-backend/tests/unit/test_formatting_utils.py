from src.common.formatting_utils import format_pbp, format_period_scores


def _action(**overrides):
    base = {
        "actionType": "Made Shot",
        "subType": "Jump Shot",
        "description": "",
        "period": 1,
        "clock": "PT10M00.00S",
        "teamTricode": "LAL",
        "playerName": "Player A",
        "scoreHome": "2",
        "scoreAway": "0",
    }
    base.update(overrides)
    return base


def test_first_jump_ball_is_labeled_opening_tip():
    actions = [_action(actionType="Jump Ball", scoreHome="0", scoreAway="0")]
    events, runs = format_pbp(actions)
    assert events[0]["event"] == "Wins opening tip"
    assert runs == []


def test_later_jump_ball_is_not_mislabeled_as_opening_tip():
    """Regression for L3: a second jump ball (e.g. preserved by crunch-time
    logic) used to always be labeled "Wins opening tip"."""
    actions = [
        _action(actionType="Jump Ball", scoreHome="0", scoreAway="0"),
        _action(actionType="Made Shot", scoreHome="2", scoreAway="0"),
        _action(
            actionType="Jump Ball",
            period=4,
            clock="PT01M00.00S",
            scoreHome="100",
            scoreAway="100",
        ),
    ]
    events, _ = format_pbp(actions)
    jump_ball_events = [e for e in events if "jump ball" in e["event"].lower() or "opening tip" in e["event"].lower()]

    assert jump_ball_events[0]["event"] == "Wins opening tip"
    assert jump_ball_events[1]["event"] == "Wins jump ball"


def test_unanswered_run_of_8_plus_is_emitted_as_structured_run():
    """LAL scores 10 unanswered, then BOS scores — the LAL run is sealed as
    a structured run with the right team, points, time span, and scorers."""
    actions = [
        # LAL opens the run up 2-0
        _action(actionType="Made Shot", subType="Jump Shot", teamTricode="LAL",
                playerName="LeBron James", scoreHome="2", scoreAway="0", clock="PT11M00.00S"),
        _action(actionType="Made Shot", subType="Jump Shot", teamTricode="LAL",
                playerName="Austin Reaves", scoreHome="4", scoreAway="0", clock="PT09M00.00S"),
        _action(actionType="Made Shot", subType="3pt Jump Shot", shotValue=3, teamTricode="LAL",
                playerName="LeBron James", scoreHome="7", scoreAway="0", clock="PT07M30.00S"),
        _action(actionType="Made Shot", subType="Jump Shot", teamTricode="LAL",
                playerName="Rui Hachimura", scoreHome="9", scoreAway="0", clock="PT06M00.00S"),
        _action(actionType="Free Throw", subType="Free Throw 1 of 1", teamTricode="LAL",
                playerName="LeBron James", scoreHome="10", scoreAway="0", clock="PT05M00.00S"),
        # BOS finally scores — run ends at LAL's last play above
        _action(actionType="Made Shot", subType="Jump Shot", teamTricode="BOS",
                playerName="Jayson Tatum", scoreHome="10", scoreAway="2", clock="PT04M00.00S"),
    ]
    _, runs = format_pbp(actions)

    assert len(runs) == 1
    run = runs[0]
    assert run["team"] == "LAL"
    assert run["points"] == 10
    assert run["scoreBefore"] == "0-0"
    assert run["startQ"] == 1
    assert run["startTime"] == "11:00"
    assert run["endQ"] == 1
    assert run["endTime"] == "05:00"  # LAL's last basket, not BOS's ending play
    assert "LeBron James" in run["players"]
    assert "Austin Reaves" in run["players"]
    assert "Rui Hachimura" in run["players"]
    assert run["players"].count("LeBron James") == 1  # deduped across two baskets


def test_run_below_threshold_is_not_emitted():
    """A 6-0 run (under the 8+ bar) is tagged on its events but not emitted
    as a structured run object."""
    actions = [
        _action(actionType="Made Shot", subType="Jump Shot", teamTricode="LAL",
                playerName="LeBron James", scoreHome="2", scoreAway="0"),
        _action(actionType="Made Shot", subType="Jump Shot", teamTricode="LAL",
                playerName="LeBron James", scoreHome="4", scoreAway="0"),
        _action(actionType="Made Shot", subType="Jump Shot", teamTricode="LAL",
                playerName="LeBron James", scoreHome="6", scoreAway="0"),
        _action(actionType="Made Shot", subType="Jump Shot", teamTricode="BOS",
                playerName="Jayson Tatum", scoreHome="6", scoreAway="2"),
    ]
    events, runs = format_pbp(actions)

    assert runs == []
    # the 6+ compression tag still applies to the LAL plays
    assert any("run" in e["tags"] for e in events)


def test_run_still_live_at_final_buzzer_is_sealed():
    """A run that ends with the running team still scoring (no opponent
    answer before the action list ends) is closed by the post-loop seal."""
    actions = [
        _action(actionType="Made Shot", subType="3pt Jump Shot", shotValue=3, teamTricode="LAL",
                playerName="LeBron James", scoreHome="3", scoreAway="0", clock="PT01M00.00S"),
        _action(actionType="Made Shot", subType="3pt Jump Shot", shotValue=3, teamTricode="LAL",
                playerName="Austin Reaves", scoreHome="6", scoreAway="0", clock="PT00M30.00S"),
        _action(actionType="Made Shot", subType="3pt Jump Shot", shotValue=3, teamTricode="LAL",
                playerName="Rui Hachimura", scoreHome="9", scoreAway="0", clock="PT00M10.00S"),
    ]
    _, runs = format_pbp(actions)

    assert len(runs) == 1
    assert runs[0]["points"] == 9
    assert runs[0]["endTime"] == "00:10"


def test_format_period_scores_labels_overtime():
    home_scores = [20, 25, 22, 21, 10]
    away_scores = [18, 24, 23, 23, 12]
    text = format_period_scores("Lakers", home_scores, "Warriors", away_scores)
    assert "Q4: Lakers 21, Warriors 23" in text
    assert "OT1: Lakers 10, Warriors 12" in text
