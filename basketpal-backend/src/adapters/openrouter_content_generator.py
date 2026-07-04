import json
import logging
import os
import random
import re
import threading
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
from pathlib import Path

import yaml
from openai import OpenAI

from src.adapters.prompts import (
    SYSTEM_PROMPT,
    KEY_MOMENTS_SYSTEM_PROMPT,
    MATCHUP_PREVIEW_SYSTEM_PROMPT,
    build_key_moments_prompt,
    build_story_prompt,
    build_matchup_preview_prompt,
)
from src.common.formatting_utils import format_team_roster, format_pbp, format_period_scores
from src.config.logger import get_logger
from src.core.entities.leagues import League, current_season
from src.core.ports import ContentProvider, InjuriesProvider, StorageClient, NBAStatsProvider

# Dedicated channel for content-generation I/O so it can be toggled without
# flooding the rest of the app. INFO always shows a concise per-call summary;
# set CONTENT_DEBUG_IO=true to also see the full prompt and raw model output.
content_logger = get_logger("basketpal.content")
_SHOW_FULL_IO = os.environ.get("CONTENT_DEBUG_IO", "").lower() in {"1", "true", "yes"}
for _handler in content_logger.handlers:
    _handler.setLevel(logging.DEBUG if _SHOW_FULL_IO else logging.INFO)


def _format_usage(usage) -> str:
    if not usage:
        return ""
    pt = getattr(usage, "prompt_tokens", None)
    ct = getattr(usage, "completion_tokens", None)
    parts = []
    if pt is not None:
        parts.append(f"prompt={pt}")
    if ct is not None:
        parts.append(f"completion={ct}")
    return f" ({', '.join(parts)})" if parts else ""


def _preview_result(result: dict | None, label: str) -> str:
    """One-line, low-volume summary of an LLM call's parsed output."""
    if not result:
        return "<empty>"
    if result.get("headline"):
        recap = (result.get("recap") or "").replace("\n", " ")
        return f'"{result["headline"]}" | {recap[:120]}'
    if result.get("keyMoments") is not None:
        return f"{len(result['keyMoments'])} moments"
    return json.dumps(result)[:120]


# --- File artifact capture -------------------------------------------------
# Each generation episode (a summary or a model comparison) writes one YAML
# file capturing every LLM call's prompt + output, annotated with the model.
# Writing is OFF by default; opt in by setting CONTENT_IO_DIR to a directory
# path. "off"/"false"/"0"/"none" also disable (no-op).
_BACKEND_ROOT = Path(__file__).resolve().parents[2]
_DEFAULT_IO_DIR = _BACKEND_ROOT / ".content_io"

_KEY_MOMENTS_PBP_MARKER = "FULL COMPRESSED PLAY-BY-PLAY:"


def _resolve_io_dir() -> Path | None:
    raw = os.environ.get("CONTENT_IO_DIR", "").strip()
    if not raw or raw.lower() in {"0", "false", "off", "none"}:
        return None
    # "default" (case-insensitive) uses the built-in gitignored location.
    if raw.lower() == "default":
        return _DEFAULT_IO_DIR
    return Path(raw).expanduser()


_IO_DIR = _resolve_io_dir()


def _redact_key_moments_prompt(prompt: str) -> str:
    """Elide the (very large) full play-by-play block from the saved key-moments
    prompt — the curated pre-flagged signals above it are kept."""
    idx = prompt.find(_KEY_MOMENTS_PBP_MARKER)
    if idx == -1:
        return prompt
    start = idx + len(_KEY_MOMENTS_PBP_MARKER)
    next_section = prompt.find("\n\n", start)
    end = next_section if next_section != -1 else len(prompt)
    body = prompt[start:end]
    est_events = body.count("{'") + body.count('{"')
    note = f" [elided for brevity — ~{est_events} play-by-play events omitted]"
    return prompt[:start] + note + prompt[end:]


def _make_call_record(label, model, system, prompt, *, raw_output, parsed,
                      latency_s, usage, status, error=None, finish_reason=None) -> dict:
    saved_prompt = _redact_key_moments_prompt(prompt) if label == "key moments" else prompt
    usage_dict = None
    if usage is not None:
        usage_dict = {
            "prompt_tokens": getattr(usage, "prompt_tokens", None),
            "completion_tokens": getattr(usage, "completion_tokens", None),
        }
    return {
        "label": label,
        "model": model,
        "status": status,
        "finish_reason": finish_reason,
        "latency_ms": int(latency_s * 1000),
        "usage": usage_dict,
        "system": system,
        "prompt": saved_prompt,
        "raw_output": raw_output,
        "parsed": parsed,
        "error": error,
    }


def _write_io_file(game_id, episode, records) -> None:
    if _IO_DIR is None or not records:
        return
    try:
        _IO_DIR.mkdir(parents=True, exist_ok=True)
        stamp = datetime.now()
        slug = re.sub(r"[^a-zA-Z0-9_-]+", "-", episode)
        filename = f"{stamp:%Y%m%d-%H%M%S}_{game_id}_{slug}.yaml"
        path = _IO_DIR / filename
        document = {
            "game_id": game_id,
            "episode": episode,
            "generated_at": stamp.isoformat(timespec="seconds"),
            "calls": records,
        }
        with open(path, "w") as f:
            # width=1000 keeps long JSON lines from wrapping; multiline prompt/
            # output strings render as readable YAML block scalars.
            yaml.safe_dump(document, f, sort_keys=False, allow_unicode=True, width=1000)
        content_logger.info("wrote content I/O artifact: %s", path)
    except Exception:
        content_logger.exception("failed to write content I/O artifact")

OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
DEFAULT_MODEL = "deepseek/deepseek-v4-flash"
KEY_MOMENTS_FALLBACK_MODEL = "anthropic/claude-haiku-4.5"
# Story generation tries models in order; both DeepSeek (repetition loops) and
# Sonnet (empty responses / token-cap truncation) have been seen failing on the
# same game, so Qwen is appended as a third resort.
STORY_FALLBACK_MODELS = ["anthropic/claude-sonnet-4.6", "qwen/qwen3.7-plus"]

# Models to pit against each other in the model-comparison view, pinned to exact
# OpenRouter slugs.
COMPARISON_MODEL_SPECS = [
    ("DeepSeek", "deepseek/deepseek-v4-flash"),
    ("Claude Sonnet", "anthropic/claude-sonnet-4.6"),
    ("GLM", "z-ai/glm-5.2"),
    ("Qwen", "qwen/qwen3.7-plus"),
]


class OpenRouterContentProvider(ContentProvider):
    def __init__(
        self,
        storage_client: StorageClient,
        nba_stats_provider: NBAStatsProvider,
        injuries_provider: InjuriesProvider,
    ):
        api_key = os.environ.get("OPENROUTER_API_KEY")

        if not api_key:
            raise RuntimeError("Missing OPENROUTER_API_KEY environment variable")

        self.client = OpenAI(api_key=api_key, base_url=OPENROUTER_BASE_URL)
        self.model = DEFAULT_MODEL
        self.storage_client = storage_client
        self.nba_stats_provider = nba_stats_provider
        self.injuries_provider = injuries_provider

    def get_game_summary(self, game_id, force_refresh: bool = False) -> dict:
        key = f"game:{game_id}:summary"

        if not force_refresh:
            cached = self.storage_client.get(key)
            if cached:
                return cached

        context = self._build_game_context(game_id)
        records = []
        key_moments = self._extract_key_moments(
            context["cleaned_pbp"], context["scoring_runs"], records=records
        )
        prompt = build_story_prompt(context, key_moments)

        recap = self._call_with_fallback(
            system=SYSTEM_PROMPT,
            prompt=prompt,
            models=[self.model, *STORY_FALLBACK_MODELS],
            validate=lambda r: r.get("headline") and r.get("recap"),
            label="story",
            records=records,
        )
        recap["keyMoments"] = key_moments

        _write_io_file(game_id, "summary", records)
        self.storage_client.save(key, recap)
        return recap

    def get_matchup_preview(self, game_id, force_refresh: bool = False) -> dict:
        key = f"game:{game_id}:matchup-preview"

        if not force_refresh:
            cached = self.storage_client.get(key)
            if cached:
                return cached

        context = self._build_preview_context(game_id)
        records = []
        prompt = build_matchup_preview_prompt(context)

        preview = self._call_with_fallback(
            system=MATCHUP_PREVIEW_SYSTEM_PROMPT,
            prompt=prompt,
            models=[self.model, *STORY_FALLBACK_MODELS],
            validate=lambda r: r.get("headline") and r.get("preview") and r.get("playersToWatch") is not None,
            label="preview",
            records=records,
        )

        _write_io_file(game_id, "matchup-preview", records)
        self.storage_client.save(key, preview)
        return preview

    def get_model_comparison(self, game_id, force_refresh: bool = False) -> list[dict]:
        key = f"game:{game_id}:model-comparison"

        if not force_refresh:
            cached = self.storage_client.get(key)
            if cached:
                return cached

        context = self._build_game_context(game_id)
        records = []
        records_lock = threading.Lock()
        key_moments = self._extract_key_moments(
            context["cleaned_pbp"], context["scoring_runs"], records=records
        )
        prompt = build_story_prompt(context, key_moments)

        def run(label_and_model):
            label, model = label_and_model
            content_logger.debug("comparison %s prompt (%s):\n%s", label, model, prompt)
            start = time.perf_counter()
            raw = parsed = usage = None
            finish_reason = None
            error = None
            status = "error"
            try:
                response = self.client.chat.completions.create(
                    model=model,
                    temperature=0.5,
                    max_tokens=3000,
                    response_format={"type": "json_object"},
                    messages=[
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": prompt},
                    ],
                    extra_body={"reasoning": {"effort": "low"}},
                )
                latency = time.perf_counter() - start
                raw = response.choices[0].message.content
                usage = getattr(response, "usage", None)
                finish_reason = getattr(response.choices[0], "finish_reason", None)
                parsed = self._parse_json(raw)
                content_logger.debug("comparison %s output (%s):\n%s", label, model, raw)
                content_logger.info(
                    "comparison %s: %s ok %.1fs%s → %s",
                    label, model, latency,
                    _format_usage(usage),
                    _preview_result(parsed, label),
                )
                status = "ok"
                return {"label": label, "model": model, **parsed, "keyMoments": key_moments}
            except Exception as exc:
                latency = time.perf_counter() - start
                error = str(exc)
                content_logger.exception(
                    "comparison %s: %s failed after %.1fs (finish_reason=%s)",
                    label, model, latency, finish_reason,
                )
                return {
                    "label": label,
                    "model": model,
                    "headline": "Generation failed",
                    "recap": "This model did not return a usable recap.",
                    "keyMoments": [],
                    "playerOfTheGame": None,
                }
            finally:
                with records_lock:
                    records.append(_make_call_record(
                        label, model, SYSTEM_PROMPT, prompt,
                        raw_output=raw, parsed=parsed, latency_s=latency,
                        usage=usage, status=status, error=error,
                        finish_reason=finish_reason,
                    ))

        with ThreadPoolExecutor(max_workers=len(COMPARISON_MODEL_SPECS)) as executor:
            results = list(executor.map(run, COMPARISON_MODEL_SPECS))

        random.shuffle(results)
        for i, result in enumerate(results):
            result["blindLabel"] = f"Recap {chr(65 + i)}"

        _write_io_file(game_id, "model-comparison", records)
        self.storage_client.save(key, results)
        return results

    def _build_game_context(self, game_id) -> dict:
        pbp = self.nba_stats_provider.get_playbyplay(game_id)
        game = self.nba_stats_provider.get_boxscore(game_id)

        home_team_id = game.homeTeam.teamId
        visitor_team_id = game.awayTeam.teamId

        home_roster = self.nba_stats_provider.get_roster(home_team_id)
        away_roster = self.nba_stats_provider.get_roster(visitor_team_id)

        home_team = f"{game.homeTeam.teamCity} {game.homeTeam.teamName}"
        away_team = f"{game.awayTeam.teamCity} {game.awayTeam.teamName}"

        home_team_score = game.homeTeam.score if game.homeTeam.score is not None else sum(game.homeTeam.periodScores)
        away_team_score = game.awayTeam.score if game.awayTeam.score is not None else sum(game.awayTeam.periodScores)

        game_type = self._get_game_type(game_id)
        series_line = f"\nSERIES: {game.seriesText}" if game.seriesText else ""

        cleaned_pbp, scoring_runs = format_pbp(pbp)

        return {
            "home_team": home_team,
            "away_team": away_team,
            "home_team_score": home_team_score,
            "away_team_score": away_team_score,
            "cleaned_home_roster": format_team_roster(home_roster),
            "cleaned_visitor_roster": format_team_roster(away_roster),
            "cleaned_period_scores": format_period_scores(
                home_team, game.homeTeam.periodScores, away_team, game.awayTeam.periodScores
            ),
            "cleaned_pbp": cleaned_pbp,
            "scoring_runs": scoring_runs,
            "game_type": game_type,
            "series_line": series_line,
        }

    def _extract_key_moments(
        self, cleaned_pbp: list[dict], scoring_runs: list[dict], records: list | None = None
    ) -> list[dict]:
        prompt = build_key_moments_prompt(cleaned_pbp, scoring_runs)

        result = self._call_with_fallback(
            system=KEY_MOMENTS_SYSTEM_PROMPT,
            prompt=prompt,
            models=[self.model, KEY_MOMENTS_FALLBACK_MODEL],
            validate=lambda r: bool(r.get("keyMoments")),
            label="key moments",
            records=records,
        )
        return result["keyMoments"]

    def _call_with_fallback(
        self,
        system: str,
        prompt: str,
        models: list[str],
        validate,
        label: str,
        max_tokens: int = 1500,
        records: list | None = None,
    ) -> dict:
        last_exc = None
        for model in models:
            content_logger.debug("%s prompt (%s):\n%s", label, model, prompt)
            start = time.perf_counter()
            raw = result = usage = finish_reason = None
            error = None
            status = "error"
            try:
                response = self.client.chat.completions.create(
                    model=model,
                    temperature=0.5,
                    max_tokens=max_tokens,
                    response_format={"type": "json_object"},
                    messages=[
                        {"role": "system", "content": system},
                        {"role": "user", "content": prompt},
                    ],
                )
                latency = time.perf_counter() - start
                raw = response.choices[0].message.content
                usage = getattr(response, "usage", None)
                finish_reason = getattr(response.choices[0], "finish_reason", None)
                result = self._parse_json(raw)
                content_logger.debug("%s output (%s):\n%s", label, model, raw)
                if validate(result):
                    status = "ok"
                    content_logger.info(
                        "%s: %s ok %.1fs%s → %s",
                        label.capitalize(), model, latency,
                        _format_usage(usage),
                        _preview_result(result, label),
                    )
                else:
                    status = "unusable"
                    last_exc = ValueError(f"Unusable {label} result from {model}")
                    content_logger.warning(
                        "%s: %s unusable in %.1fs (finish_reason=%s) → %s, trying fallback",
                        label.capitalize(), model, latency, finish_reason,
                        _preview_result(result, label),
                    )
            except Exception as exc:
                latency = time.perf_counter() - start
                error = str(exc)
                content_logger.warning(
                    "%s generation failed with %s after %.1fs (finish_reason=%s): %s",
                    label.capitalize(), model, latency, finish_reason, exc,
                )
                last_exc = exc
            if records is not None:
                records.append(_make_call_record(
                    label, model, system, prompt,
                    raw_output=raw, parsed=result, latency_s=latency,
                    usage=usage, status=status, error=error,
                    finish_reason=finish_reason,
                ))
            if status == "ok":
                return result
        raise last_exc or RuntimeError(f"All {label} generation models failed")

    @staticmethod
    def _get_game_type(game_id: str) -> str:
        # The 3rd digit of an NBA game ID encodes season type: 1=preseason,
        # 2=regular season, 3=all-star, 4=playoffs, 5=play-in tournament.
        season_type = game_id[2] if len(game_id) > 2 else ""
        return {
            "1": "Preseason",
            "2": "Regular Season",
            "3": "All-Star",
            "4": "Playoffs",
            "5": "Play-In Tournament",
        }.get(season_type, "Regular Season")

    @staticmethod
    def _parse_json(content: str) -> dict:
        if not content:
            raise ValueError("Empty response from model")

        text = content.strip()
        if text.startswith("```"):
            text = text.strip("`")
            if text.lower().startswith("json"):
                text = text[4:]
            text = text.strip()

        return json.loads(text)

    # --- Matchup preview --------------------------------------------------
    # Pre-game previews can't reuse _build_game_context (which depends on PBP +
    # a played boxscore). Instead we pull season-level context — standings,
    # team/player season averages, recent form + head-to-head, rosters, and
    # injuries — across two providers, then hand a formatted context dict to the
    # preview prompt. League/team fetches are cached (1h) so generating previews
    # for multiple games on the same day shares the heavy league-wide calls.

    _LEAGUE_CACHE_TTL = 3600        # standings / team & player season stats
    _ROSTER_CACHE_TTL = 86400       # rosters change slowly
    _INJURIES_CACHE_TTL = 900       # injuries shift day-to-day

    def _cached(self, key: str, ttl: int, fn) -> any:
        cached = self.storage_client.get(key)
        if cached is not None:
            return cached
        value = fn()
        self.storage_client.save_with_ttl(key, value, ttl)
        return value

    def _fetch_team_stats(self, season, league) -> list:
        try:
            return self._cached(
                f"league:{season}:teamstats", self._LEAGUE_CACHE_TTL,
                lambda: self.nba_stats_provider.get_team_season_stats(season, league.league_id),
            )
        except Exception as exc:
            content_logger.warning("team season stats fetch failed: %s", exc)
            return []

    def _fetch_player_stats(self, season, league) -> list:
        try:
            return self._cached(
                f"league:{season}:playerstats", self._LEAGUE_CACHE_TTL,
                lambda: self.nba_stats_provider.get_player_season_stats(season, league.league_id),
            )
        except Exception as exc:
            content_logger.warning("player season stats fetch failed: %s", exc)
            return []

    def _fetch_roster(self, team_id) -> list:
        try:
            return self._cached(
                f"team:{team_id}:roster", self._ROSTER_CACHE_TTL,
                lambda: self.nba_stats_provider.get_roster(team_id),
            )
        except Exception as exc:
            content_logger.warning("roster fetch failed for team %s: %s", team_id, exc)
            return []

    def _fetch_game_log(self, team_id, season, league) -> list:
        try:
            return self._cached(
                f"team:{team_id}:gamelog:{season}", self._LEAGUE_CACHE_TTL,
                lambda: self.nba_stats_provider.get_team_game_log(team_id, season, league.league_id),
            )
        except Exception as exc:
            content_logger.warning("game log fetch failed for team %s: %s", team_id, exc)
            return []

    def _fetch_injuries(self, league) -> list:
        try:
            return self._cached(
                f"league:{league.code}:injuries", self._INJURIES_CACHE_TTL,
                lambda: self.injuries_provider.get_injuries(league),
            )
        except Exception as exc:
            content_logger.warning("injuries fetch failed: %s", exc)
            return []

    @staticmethod
    def _find_row(rows: list, field: str, value) -> dict:
        # NBA endpoints return TeamID as int in some result sets and str in
        # others; coerce both sides to str so the lookup is robust.
        target = str(value)
        for row in rows:
            if str(row.get(field)) == target:
                return row
        return {}

    @staticmethod
    def _dash_record(ts: dict) -> str:
        # Season W-L totals come from leaguedashteamstats (W/L are counts even
        # under PerMode=PerGame).
        if not ts:
            return "—"
        return f"{ts.get('W', 0)}-{ts.get('L', 0)}"

    @staticmethod
    def _dash_winpct(ts: dict) -> str:
        if not ts:
            return "—"
        pct = ts.get("W_PCT")
        return f"{float(pct):.3f}" if pct not in (None, "") else "—"

    @staticmethod
    def _gamelog_last10(gamelog: list) -> str:
        if not gamelog:
            return "—"
        recent = list(reversed(gamelog))[:10]
        wins = sum(1 for g in recent if g.get("WL") == "W")
        return f"{wins}-{len(recent) - wins}"

    @staticmethod
    def _gamelog_streak(gamelog: list) -> str:
        if not gamelog:
            return "—"
        # gamelog is oldest→newest; count consecutive same results from the end.
        recent = list(reversed(gamelog))
        first = recent[0].get("WL")
        if not first:
            return "—"
        n = 0
        for g in recent:
            if g.get("WL") == first:
                n += 1
            else:
                break
        return f"{first}{n}"  # e.g. "W3" / "L2"

    @staticmethod
    def _gamelog_venue_record(gamelog: list, is_home: bool) -> str:
        # MATCHUP "BOS vs. LAL" → home game; "BOS @ LAL" → away game.
        if not gamelog:
            return "—"
        marker = "vs." if is_home else "@"
        games = [g for g in gamelog if marker in (g.get("MATCHUP") or "")]
        if not games:
            return "—"
        wins = sum(1 for g in games if g.get("WL") == "W")
        return f"{wins}-{len(games) - wins}"

    @staticmethod
    def _team_stats_line(ts: dict) -> str:
        if not ts:
            return "No data"
        return (
            f"{ts.get('PTS', '—')} PTS, {ts.get('REB', '—')} REB, {ts.get('AST', '—')} AST, "
            f"{ts.get('FG_PCT', '—')} FG%, {ts.get('FG3_PCT', '—')} 3P%, {ts.get('TOV', '—')} TOV"
        )

    @staticmethod
    def _leaders(players: list) -> str:
        if not players:
            return "No data"
        scorers = sorted(players, key=lambda r: r.get("PTS") or 0, reverse=True)[:3]
        parts = [
            f"{p.get('PLAYER_NAME', '?')} ({p.get('PTS', '—')} PPG, "
            f"{p.get('REB', '—')} RPG, {p.get('AST', '—')} APG)"
            for p in scorers
        ]
        return "; ".join(parts)

    @staticmethod
    def _form(gamelog: list) -> str:
        if not gamelog:
            return "No data"
        # teamgamelog is oldest→newest; surface most recent first.
        recent = list(reversed(gamelog))[:5]
        parts = []
        for g in recent:
            wl = g.get("WL", "?")
            matchup = g.get("MATCHUP", "")
            pts = g.get("PTS")
            parts.append(f"{wl} {matchup} {pts}" if pts is not None else f"{wl} {matchup}")
        return ", ".join(parts)

    @staticmethod
    def _h2h(home_gamelog: list, away_gamelog: list, away_tri: str, home_tri: str,
             home_name: str, away_name: str) -> str:
        # teamgamelog carries only the logging team's PTS (no margin/opponent
        # score), so join the two teams' logs on Game_ID to recover both scores.
        home_meetings = {g.get("Game_ID"): g for g in home_gamelog
                         if away_tri in (g.get("MATCHUP") or "")}
        if not home_meetings:
            return f"{home_name} and {away_name} have not met this season."
        away_by_gid = {g.get("Game_ID"): g for g in away_gamelog
                       if home_tri in (g.get("MATCHUP") or "")}
        wins = sum(1 for g in home_meetings.values() if g.get("WL") == "W")
        losses = len(home_meetings) - wins
        # home_meetings preserves gamelog (oldest→newest) order, so the last key
        # is the most recent meeting.
        last_gid = list(home_meetings)[-1]
        hp = home_meetings[last_gid].get("PTS")
        ap = away_by_gid.get(last_gid, {}).get("PTS")
        score = "score unavailable"
        if hp is not None and ap is not None:
            score = f"{home_tri} {hp}, {away_tri} {ap}"
        return f"Season series: {home_tri} {wins}-{losses} {away_tri}. Last meeting: {score}."

    @staticmethod
    def _roster_line(roster: list) -> list | str:
        names = format_team_roster(roster)
        return names if names else "No roster data"

    @staticmethod
    def _injuries_line(rows: list) -> str:
        if not rows:
            return "None reported"
        parts = []
        for r in rows:
            name = r.get("player_name") or "?"
            status = r.get("status") or "unknown"
            itype = r.get("injury_type")
            suffix = f", {itype}" if itype else ""
            parts.append(f"{name} ({status}{suffix})")
        return "; ".join(parts)

    def _build_preview_context(self, game_id) -> dict:
        game = self.nba_stats_provider.get_boxscore(game_id)
        home = game.homeTeam
        away = game.awayTeam
        home_id, away_id = home.teamId, away.teamId
        home_tri, away_tri = home.teamTricode, away.teamTricode
        home_name = f"{home.teamCity} {home.teamName}"
        away_name = f"{away.teamCity} {away.teamName}"

        league = League.from_game_id(game_id)
        season = current_season()

        # Fan out the data calls; each degrades to an empty default on failure
        # so a single flaky feed doesn't block preview generation. Records come
        # from the dash team-stats call (W/L/WinPCT), and Last-10 / streak /
        # home-road splits are derived from each team's game log.
        with ThreadPoolExecutor(max_workers=5) as ex:
            f_teamstats = ex.submit(self._fetch_team_stats, season, league)
            f_playerstats = ex.submit(self._fetch_player_stats, season, league)
            f_home_roster = ex.submit(self._fetch_roster, home_id)
            f_away_roster = ex.submit(self._fetch_roster, away_id)
            f_home_gamelog = ex.submit(self._fetch_game_log, home_id, season, league)
            f_away_gamelog = ex.submit(self._fetch_game_log, away_id, season, league)
            f_injuries = ex.submit(self._fetch_injuries, league)

            teamstats_rows = f_teamstats.result()
            playerstats_rows = f_playerstats.result()
            home_roster = f_home_roster.result()
            away_roster = f_away_roster.result()
            home_gamelog = f_home_gamelog.result()
            away_gamelog = f_away_gamelog.result()
            injuries_rows = f_injuries.result()

        home_ts = self._find_row(teamstats_rows, "TEAM_ID", home_id)
        away_ts = self._find_row(teamstats_rows, "TEAM_ID", away_id)
        home_players = [r for r in playerstats_rows if str(r.get("TEAM_ID")) == str(home_id)]
        away_players = [r for r in playerstats_rows if str(r.get("TEAM_ID")) == str(away_id)]
        home_injuries = [r for r in injuries_rows if r.get("team_tricode") == home_tri]
        away_injuries = [r for r in injuries_rows if r.get("team_tricode") == away_tri]

        series_line = f"\nSERIES: {game.seriesText}" if game.seriesText else ""
        game_type = self._get_game_type(game_id)

        return {
            "home_team": home_name,
            "away_team": away_name,
            "game_type": game_type,
            "series_line": series_line,
            "game_time": game.gameTimeUTC or "",
            "home_record": self._dash_record(home_ts),
            "home_standings": self._dash_winpct(home_ts),
            "home_last10": self._gamelog_last10(home_gamelog),
            "home_streak": self._gamelog_streak(home_gamelog),
            "home_home_record": self._gamelog_venue_record(home_gamelog, is_home=True),
            "away_record": self._dash_record(away_ts),
            "away_standings": self._dash_winpct(away_ts),
            "away_last10": self._gamelog_last10(away_gamelog),
            "away_streak": self._gamelog_streak(away_gamelog),
            "away_road_record": self._gamelog_venue_record(away_gamelog, is_home=False),
            "home_form": self._form(home_gamelog),
            "away_form": self._form(away_gamelog),
            "h2h": self._h2h(home_gamelog, away_gamelog, away_tri, home_tri, home_name, away_name),
            "home_team_stats": self._team_stats_line(home_ts),
            "away_team_stats": self._team_stats_line(away_ts),
            "home_leaders": self._leaders(home_players),
            "away_leaders": self._leaders(away_players),
            "home_roster": self._roster_line(home_roster),
            "away_roster": self._roster_line(away_roster),
            "home_injuries": self._injuries_line(home_injuries),
            "away_injuries": self._injuries_line(away_injuries),
        }
