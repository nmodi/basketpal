import json
from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest

from src.adapters.openrouter_content_generator import OpenRouterContentProvider
from src.core.entities.game import BBallIndivStats, BBallPlayer, GameSnapshot, TeamSummary


@pytest.fixture
def provider(monkeypatch):
    monkeypatch.setenv("OPENROUTER_API_KEY", "test-key")
    return OpenRouterContentProvider(
        storage_client=MagicMock(),
        nba_stats_provider=MagicMock(),
        injuries_provider=MagicMock(),
    )


# --- scripted fake OpenAI client -------------------------------------------

def _msg(content=None, tool_calls=None):
    return SimpleNamespace(role="assistant", content=content, tool_calls=tool_calls)


def _tc(call_id, name, arguments):
    return SimpleNamespace(id=call_id, function=SimpleNamespace(name=name, arguments=arguments))


class ScriptedClient:
    """chat.completions.create pops one scripted message per call and records
    the kwargs of every call."""

    def __init__(self, messages):
        self._script = list(messages)
        self.calls = []
        self.chat = SimpleNamespace(completions=SimpleNamespace(create=self._create))

    def _create(self, **kwargs):
        self.calls.append(kwargs)
        return SimpleNamespace(
            choices=[SimpleNamespace(message=self._script.pop(0), finish_reason="stop")],
            usage=None,
        )


def _run(provider, script, impls=None, models=("m1",)):
    provider.client = ScriptedClient(script)
    return provider._run_agent(
        system="sys",
        user_prompt="prompt",
        tools=[],
        tool_impls=impls or {},
        models=list(models),
        label="test",
        records=None,
    )


# --- researcher loop ---------------------------------------------------------

def test_happy_path_tools_then_finish(provider):
    seen = []
    impls = {
        "get_recent_form": lambda team: seen.append(("form", team)) or "Last 10: 7-3",
        "get_head_to_head": lambda: seen.append(("h2h",)) or "Series tied 1-1.",
    }
    dossier, notes, log = _run(provider, [
        _msg(tool_calls=[
            _tc("1", "get_recent_form", '{"team": "home"}'),
            _tc("2", "get_head_to_head", "{}"),
        ]),
        _msg(tool_calls=[_tc("3", "finish_research", '{"notes": "Angle: road win"}')]),
    ], impls=impls)

    assert dossier == [
        ("get_recent_form", {"team": "home"}, "Last 10: 7-3"),
        ("get_head_to_head", {}, "Series tied 1-1."),
    ]
    assert notes == "Angle: road win"
    assert [e["tool"] for e in log] == ["get_recent_form", "get_head_to_head", "finish_research"]
    assert log[0]["args"] == {"team": "home"}
    assert log[0]["summary"] == "Last 10: 7-3"
    assert log[2]["summary"] == "Angle: road win"
    assert seen == [("form", "home"), ("h2h",)]


def test_tool_error_is_returned_to_model_not_raised(provider):
    def boom(team):
        raise ValueError("upstream down")

    dossier, _, _ = _run(provider, [
        _msg(tool_calls=[_tc("1", "get_recent_form", '{"team": "away"}')]),
        _msg(tool_calls=[_tc("2", "get_head_to_head", "{}")]),
        _msg(tool_calls=[_tc("3", "finish_research", "{}")]),
    ], impls={"get_recent_form": boom, "get_head_to_head": lambda: "Series tied 1-1."})

    # errored calls go back to the model but stay out of the writer dossier
    assert dossier == [("get_head_to_head", {}, "Series tied 1-1.")]
    second_call_messages = provider.client.calls[1]["messages"]
    tool_msgs = [m for m in second_call_messages if isinstance(m, dict) and m.get("role") == "tool"]
    assert tool_msgs[0]["content"].startswith("error:")


def test_malformed_arguments_do_not_raise(provider):
    dossier, _, _ = _run(provider, [
        _msg(tool_calls=[_tc("1", "get_recent_form", "not json")]),
        _msg(tool_calls=[_tc("2", "get_recent_form", '{"team": "home"}')]),
        _msg(tool_calls=[_tc("3", "finish_research", "{}")]),
    ], impls={"get_recent_form": lambda team: "ok"})

    assert dossier == [("get_recent_form", {"team": "home"}, "ok")]
    tool_msgs = [m for m in provider.client.calls[1]["messages"]
                 if isinstance(m, dict) and m.get("role") == "tool"]
    assert tool_msgs[0]["content"].startswith("error: invalid arguments")


def test_finish_with_empty_dossier_is_rejected(provider):
    dossier, _, log = _run(provider, [
        _msg(tool_calls=[_tc("1", "finish_research", "{}")]),
        _msg(tool_calls=[_tc("2", "get_recent_form", '{"team": "home"}')]),
        _msg(tool_calls=[_tc("3", "finish_research", "{}")]),
    ], impls={"get_recent_form": lambda team: "ok"})

    assert dossier == [("get_recent_form", {"team": "home"}, "ok")]
    tool_msgs = [m for m in provider.client.calls[1]["messages"]
                 if isinstance(m, dict) and m.get("role") == "tool"]
    assert "call research tools before finishing" in tool_msgs[0]["content"]


def test_prose_only_model_is_abandoned_after_one_nudge(provider):
    with pytest.raises(RuntimeError, match="stopped calling tools"):
        _run(provider, [_msg(content="Here is my report."), _msg(content="More prose.")])


def test_nudge_resets_after_productive_tool_step(provider):
    dossier, _, _ = _run(provider, [
        _msg(content="Let me think."),
        _msg(tool_calls=[_tc("1", "get_recent_form", '{"team": "home"}')]),
        _msg(content="Thinking again."),
        _msg(tool_calls=[_tc("2", "finish_research", "{}")]),
    ], impls={"get_recent_form": lambda team: "ok"})
    assert dossier == [("get_recent_form", {"team": "home"}, "ok")]


# --- writer ------------------------------------------------------------------

def _write(provider, fact_check, log=None):
    return provider._write_report(
        system="sys",
        base_prompt="base",
        validate=lambda r: r.get("headline"),
        fact_check=fact_check,
        label="test",
        research_log=log if log is not None else [],
        records=None,
    )


def test_writer_happy_path(provider):
    provider._call_with_fallback = MagicMock(return_value={"headline": "H", "recap": "R"})
    log = []
    report = _write(provider, fact_check=lambda r: [], log=log)
    assert report["headline"] == "H"
    assert [e["tool"] for e in log] == ["write_report"]
    assert log[0]["summary"] == "H"
    kwargs = provider._call_with_fallback.call_args.kwargs
    assert kwargs["label"] == "test writer"


def test_writer_fact_check_rejection_then_corrected_draft(provider):
    provider._call_with_fallback = MagicMock(side_effect=[
        {"headline": "Bad"}, {"headline": "Good"},
    ])
    fact_check = lambda r: [] if r["headline"] == "Good" else ["'Jalen Green' is not on either roster"]
    log = []
    report = _write(provider, fact_check=fact_check, log=log)

    assert report["headline"] == "Good"
    assert [e["tool"] for e in log] == ["fact_check", "write_report"]
    assert "Jalen Green" in log[0]["summary"]
    retry_prompt = provider._call_with_fallback.call_args_list[1].kwargs["prompt"]
    assert "PROBLEMS WITH YOUR PREVIOUS DRAFT" in retry_prompt
    assert "Jalen Green" in retry_prompt
    assert '"Bad"' in retry_prompt  # rejected draft is echoed back


def test_writer_repeated_fact_check_failures_raise(provider):
    provider._call_with_fallback = MagicMock(return_value={"headline": "Bad"})
    with pytest.raises(RuntimeError, match="failed fact-checks"):
        _write(provider, fact_check=lambda r: ["wrong"])
    assert provider._call_with_fallback.call_count == 3  # AGENT_MAX_FACT_CHECK_RETRIES + 1


def test_agent_failure_falls_back_to_static_path(provider, monkeypatch):
    provider.storage_client.get.return_value = None
    provider.nba_stats_provider.get_boxscore.return_value = _game(status=1)
    monkeypatch.setattr(provider, "_fetch_roster", lambda team_id: [])
    static_result = {"headline": "Static", "preview": "P", "playersToWatch": []}
    monkeypatch.setattr(provider, "_agent_preview", MagicMock(side_effect=RuntimeError("no tools")))
    monkeypatch.setattr(provider, "_build_preview_context", MagicMock(return_value={}))
    monkeypatch.setattr(
        "src.adapters.openrouter_content_generator.build_matchup_preview_prompt", lambda ctx: "p"
    )
    monkeypatch.setattr(provider, "_call_with_fallback", MagicMock(return_value=static_result))

    result = provider.get_matchup_preview("0022400001")

    assert result == static_result
    assert "researchLog" not in result
    provider.storage_client.save.assert_called_once()


def test_writer_failure_falls_back_to_static_path(provider, monkeypatch):
    provider.storage_client.get.return_value = None
    provider.nba_stats_provider.get_boxscore.return_value = _game(status=1)
    monkeypatch.setattr(provider, "_fetch_roster", lambda team_id: [])
    monkeypatch.setattr(
        provider, "_run_agent",
        MagicMock(return_value=([("get_roster", {}, "ok")], "", [])),
    )
    monkeypatch.setattr(
        provider, "_write_report",
        MagicMock(side_effect=RuntimeError("writer failed fact-checks 3 times during preview")),
    )
    static_result = {"headline": "Static", "preview": "P", "playersToWatch": []}
    monkeypatch.setattr(provider, "_build_preview_context", MagicMock(return_value={}))
    monkeypatch.setattr(
        "src.adapters.openrouter_content_generator.build_matchup_preview_prompt", lambda ctx: "p"
    )
    monkeypatch.setattr(provider, "_call_with_fallback", MagicMock(return_value=static_result))

    result = provider.get_matchup_preview("0022400001")

    assert result == static_result
    assert "researchLog" not in result


# --- deterministic fact checks ----------------------------------------------

def _stats(points=0, rebounds=0, assists=0, minutes="PT32M10.00S"):
    return BBallIndivStats(
        points=points, assists=assists, reboundsDefensive=0, reboundsOffensive=0,
        reboundsTotal=rebounds, steals=0, blocks=0, foulsPersonal=0, foulsTechnical=0,
        fieldGoalsAttempted=0, fieldGoalsMade=0, threePointersAttempted=0,
        threePointersMade=0, freeThrowsAttempted=0, freeThrowsMade=0,
        plusMinusPoints=0, minutes=minutes, pointsInThePaint=0, turnovers=0,
    )


def _game(status=3):
    return GameSnapshot(
        gameId="0022400001", gameStatus=status, gameTimeUTC="2026-01-01T00:00:00Z",
        gameCode="20260101/LALGSW",
        homeTeam=TeamSummary(
            teamId=1, teamTricode="LAL", teamCity="Los Angeles", teamName="Lakers",
            score=110,
            players=[
                BBallPlayer(name="LeBron James", stats=_stats(points=28, rebounds=8, assists=11)),
                BBallPlayer(name="Austin Reaves", stats=_stats(points=0, minutes="PT00M00.00S")),
            ],
        ),
        awayTeam=TeamSummary(
            teamId=2, teamTricode="GSW", teamCity="Golden State", teamName="Warriors",
            score=104,
            players=[BBallPlayer(name="Stephen Curry", stats=_stats(points=35, rebounds=5, assists=6))],
        ),
    )


ROSTER = {"LeBron James", "Austin Reaves", "Stephen Curry"}

CLEAN_RECAP = {
    "headline": "Lakers hold off Warriors",
    "recap": "The Los Angeles Lakers beat the Golden State Warriors 110-104. "
             "LeBron James finished with 28 points. Stephen Curry scored 35 points in the loss.",
    "playerOfTheGame": {"name": "LeBron James", "reason": "Controlled the game."},
}


def test_clean_recap_passes():
    assert OpenRouterContentProvider._check_recap_facts(CLEAN_RECAP, _game(), ROSTER) == []


def test_wrong_score_caught():
    report = dict(CLEAN_RECAP, recap=CLEAN_RECAP["recap"].replace("110-104", "112-104"))
    problems = OpenRouterContentProvider._check_recap_facts(report, _game(), ROSTER)
    assert any("112-104" in p for p in problems)


def test_invented_player_caught():
    report = dict(CLEAN_RECAP, recap=CLEAN_RECAP["recap"] + " Jalen Green added 20.")
    problems = OpenRouterContentProvider._check_recap_facts(report, _game(), ROSTER)
    assert any("Jalen Green" in p for p in problems)


def test_wrong_stat_line_caught():
    report = dict(CLEAN_RECAP, recap=CLEAN_RECAP["recap"].replace("28 points", "38 points"))
    problems = OpenRouterContentProvider._check_recap_facts(report, _game(), ROSTER)
    assert any("38 points" in p and "28" in p for p in problems)


def test_wrong_shooting_split_caught():
    report = dict(CLEAN_RECAP, recap=CLEAN_RECAP["recap"] +
                  " Stephen Curry shot 9-of-20 from three.")
    problems = OpenRouterContentProvider._check_recap_facts(report, _game(), ROSTER)
    assert any("9-of-20 from three" in p and "0-of-0" in p for p in problems)


def test_correct_shooting_split_passes():
    report = dict(CLEAN_RECAP, recap=CLEAN_RECAP["recap"] +
                  " Stephen Curry shot 0-of-0 from the field.")
    assert OpenRouterContentProvider._check_recap_facts(report, _game(), ROSTER) == []


def test_potg_who_did_not_play_caught():
    report = dict(CLEAN_RECAP, playerOfTheGame={"name": "Austin Reaves", "reason": "?"})
    problems = OpenRouterContentProvider._check_recap_facts(report, _game(), ROSTER)
    assert any("did not play" in p for p in problems)


def test_string_potg_flagged_not_crashed():
    report = dict(CLEAN_RECAP, playerOfTheGame="LeBron James")
    problems = OpenRouterContentProvider._check_recap_facts(report, _game(), ROSTER)
    assert any("must be an object" in p for p in problems)


def test_string_players_to_watch_entry_flagged_not_crashed():
    report = {"headline": "H", "preview": "P", "playersToWatch": ["Stephen Curry"]}
    problems = OpenRouterContentProvider._check_preview_facts(report, ROSTER, _game())
    assert any("must be an object" in p for p in problems)


def test_preview_with_non_roster_player_caught():
    report = {
        "headline": "H", "preview": "A big matchup.",
        "playersToWatch": [{"name": "Victor Wembanyama", "reason": "?"}],
    }
    problems = OpenRouterContentProvider._check_preview_facts(report, ROSTER, _game())
    assert any("Victor Wembanyama" in p for p in problems)


def test_preview_stating_a_score_caught():
    report = {"headline": "H", "preview": "Expect a repeat of the 121-113 result.", "playersToWatch": []}
    problems = OpenRouterContentProvider._check_preview_facts(report, ROSTER, _game())
    assert any("has not been played" in p for p in problems)


def test_recap_agent_top_performers_tool(provider):
    context = {
        "game": _game(),
        "game_type": "Regular Season",
        "series_line": "",
        "home_team": "Los Angeles Lakers",
        "away_team": "Golden State Warriors",
        "home_team_score": 110,
        "away_team_score": 104,
        "cleaned_home_roster": ["LeBron James", "Austin Reaves"],
        "cleaned_visitor_roster": ["Stephen Curry"],
        "cleaned_period_scores": "scores",
        "scoring_runs": [],
        "cleaned_pbp": [],
    }
    provider.client = ScriptedClient([
        _msg(tool_calls=[
            _tc("1", "get_top_performers", '{"team": "away"}'),
            _tc("2", "get_team_stats_comparison", "{}"),
        ]),
        _msg(tool_calls=[_tc("3", "finish_research", "{}")]),
    ])
    provider._call_with_fallback = MagicMock(return_value=dict(CLEAN_RECAP))
    report, log = provider._agent_recap("0022400001", context, [], {})
    assert report["headline"] == CLEAN_RECAP["headline"]
    assert log[0]["tool"] == "get_top_performers"
    assert "Stephen Curry" in log[0]["summary"]
    assert "35 pts, 5 reb, 6 ast" in log[0]["summary"]
    assert log[1]["tool"] == "get_team_stats_comparison"
    assert "LAL" in log[1]["summary"] and "GSW" in log[1]["summary"]
    assert [e["tool"] for e in log[2:]] == ["finish_research", "write_report"]
    # the writer prompt carries the full tool results, not the 140-char summaries
    writer_prompt = provider._call_with_fallback.call_args.kwargs["prompt"]
    assert "### get_top_performers (away)" in writer_prompt
    assert "35 pts, 5 reb, 6 ast" in writer_prompt


def test_recap_agent_head_to_head_excludes_this_game(provider):
    context = {
        "game": _game(),
        "game_type": "Regular Season",
        "series_line": "",
        "home_team": "Los Angeles Lakers",
        "away_team": "Golden State Warriors",
        "home_team_score": 110,
        "away_team_score": 104,
        "cleaned_home_roster": ["LeBron James", "Austin Reaves"],
        "cleaned_visitor_roster": ["Stephen Curry"],
        "cleaned_period_scores": "scores",
        "scoring_runs": [],
        "cleaned_pbp": [],
    }
    provider._fetch_game_log = lambda *a: [
        {"GAME_ID": "0022300500", "MATCHUP": "LAL vs. GSW", "WL": "W", "PTS": 120, "PLUS_MINUS": 5},
        {"GAME_ID": "0022400001", "MATCHUP": "LAL vs. GSW", "WL": "W", "PTS": 110, "PLUS_MINUS": 6},
    ]
    provider.client = ScriptedClient([
        _msg(tool_calls=[_tc("1", "get_head_to_head", "{}")]),
        _msg(tool_calls=[_tc("2", "finish_research", "{}")]),
    ])
    provider._call_with_fallback = MagicMock(return_value=dict(CLEAN_RECAP))
    _, log = provider._agent_recap("0022400001", context, [], {})
    assert log[0]["tool"] == "get_head_to_head"
    assert "LAL 1-0 GSW" in log[0]["summary"]
    assert "LAL 120" in log[0]["summary"]  # last meeting is the prior game, not this one


def test_wrong_winner_caught():
    report = dict(CLEAN_RECAP, recap="The Golden State Warriors beat the Los Angeles Lakers 110-104. "
                                     "LeBron James finished with 28 points.")
    problems = OpenRouterContentProvider._check_recap_facts(report, _game(), ROSTER)
    assert any("Warriors as beating the Lakers" in p for p in problems)


def test_negated_winner_sentence_passes():
    report = dict(CLEAN_RECAP, recap=CLEAN_RECAP["recap"] +
                  " The Warriors could not beat the Lakers late.")
    assert OpenRouterContentProvider._check_recap_facts(report, _game(), ROSTER) == []


def test_winner_not_named_caught():
    report = dict(CLEAN_RECAP, headline="A statement win",
                  recap="The home side cruised to a 110-104 victory. "
                        "LeBron James finished with 28 points.")
    problems = OpenRouterContentProvider._check_recap_facts(report, _game(), ROSTER)
    assert any("name the winning team" in p for p in problems)


def test_quarter_scoped_stat_claim_skipped():
    report = dict(CLEAN_RECAP, recap=CLEAN_RECAP["recap"] +
                  " LeBron James scored 12 points in the fourth quarter.")
    assert OpenRouterContentProvider._check_recap_facts(report, _game(), ROSTER) == []


def test_boards_synonym_caught():
    report = dict(CLEAN_RECAP, recap=CLEAN_RECAP["recap"] + " LeBron James grabbed 10 boards.")
    problems = OpenRouterContentProvider._check_recap_facts(report, _game(), ROSTER)
    assert any("10 boards" in p and "8" in p for p in problems)


def test_threes_count_caught():
    report = dict(CLEAN_RECAP, recap=CLEAN_RECAP["recap"] + " Stephen Curry drained 5 threes.")
    problems = OpenRouterContentProvider._check_recap_facts(report, _game(), ROSTER)
    assert any("5 threes" in p for p in problems)


def test_shot_split_number_not_double_counted_as_stat_claim():
    report = dict(CLEAN_RECAP, recap=CLEAN_RECAP["recap"] +
                  " Stephen Curry went 0-of-0 three-pointers on the night.")
    assert OpenRouterContentProvider._check_recap_facts(report, _game(), ROSTER) == []


def test_preview_prose_invented_player_caught():
    report = {"headline": "H", "preview": "Keep an eye on Jalen Green tonight.", "playersToWatch": []}
    problems = OpenRouterContentProvider._check_preview_facts(report, ROSTER, _game())
    assert any("Jalen Green" in p for p in problems)


def test_preview_other_team_mention_allowed():
    report = {"headline": "H", "preview": "Both sides are coming off losses in Oklahoma City.",
              "playersToWatch": []}
    assert OpenRouterContentProvider._check_preview_facts(report, ROSTER, _game()) == []


# --- shadow judge ------------------------------------------------------------

def _recap_context():
    return {
        "game": _game(),
        "home_team": "Los Angeles Lakers",
        "away_team": "Golden State Warriors",
        "home_team_score": 110,
        "away_team_score": 104,
        "cleaned_period_scores": "scores",
        "scoring_runs": [],
    }


def test_shadow_judge_calls_judge_model_and_records(provider):
    provider._call_with_fallback = MagicMock(return_value={"problems": []})
    provider._shadow_judge_recap("g1", CLEAN_RECAP, _recap_context(), [])
    kwargs = provider._call_with_fallback.call_args.kwargs
    assert kwargs["label"] == "shadow judge"
    assert "35 pts" in kwargs["prompt"]  # ground truth includes boxscore lines
    assert CLEAN_RECAP["recap"] in kwargs["prompt"]


def test_shadow_judge_never_raises(provider):
    provider._call_with_fallback = MagicMock(side_effect=RuntimeError("judge down"))
    provider._shadow_judge_recap("g1", CLEAN_RECAP, _recap_context(), [])
    # also survives a garbage context entirely
    provider._shadow_judge_recap("g2", CLEAN_RECAP, {}, [])


# --- generation guards -------------------------------------------------------

def test_summary_refuses_non_final_game(provider, monkeypatch):
    provider.storage_client.get.return_value = None
    monkeypatch.setattr(provider, "_build_game_context", lambda gid: {"game": _game(status=2)})
    with pytest.raises(ValueError, match="not final"):
        provider.get_game_summary("0022400001")


def test_preview_refuses_started_game(provider):
    provider.storage_client.get.return_value = None
    provider.nba_stats_provider.get_boxscore.return_value = _game(status=3)
    with pytest.raises(ValueError, match="already started"):
        provider.get_matchup_preview("0022400001")


def test_refresh_cooldown(monkeypatch):
    from src.entrypoints.web import game_details
    store = {}
    fake = SimpleNamespace(
        get=lambda k: store.get(k),
        save_with_ttl=lambda k, v, ttl: store.__setitem__(k, v),
    )
    monkeypatch.setattr(game_details, "storage_client", fake)
    assert game_details._refresh_allowed("g1", "summary") is True
    assert game_details._refresh_allowed("g1", "summary") is False
    # independent per blob and per game
    assert game_details._refresh_allowed("g1", "matchup-preview") is True
    assert game_details._refresh_allowed("g2", "summary") is True
