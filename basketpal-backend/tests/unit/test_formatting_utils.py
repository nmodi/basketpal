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
    events = format_pbp(actions)
    assert events[0]["event"] == "Wins opening tip"


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
    events = format_pbp(actions)
    jump_ball_events = [e for e in events if "jump ball" in e["event"].lower() or "opening tip" in e["event"].lower()]

    assert jump_ball_events[0]["event"] == "Wins opening tip"
    assert jump_ball_events[1]["event"] == "Wins jump ball"


def test_format_period_scores_labels_overtime():
    home_scores = [20, 25, 22, 21, 10]
    away_scores = [18, 24, 23, 23, 12]
    text = format_period_scores("Lakers", home_scores, "Warriors", away_scores)
    assert "Q4: Lakers 21, Warriors 23" in text
    assert "OT1: Lakers 10, Warriors 12" in text
