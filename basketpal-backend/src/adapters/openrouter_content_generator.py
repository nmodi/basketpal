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
    build_key_moments_prompt,
    build_story_prompt,
)
from src.common.formatting_utils import format_team_roster, format_pbp, format_period_scores
from src.config.logger import get_logger
from src.core.ports import ContentProvider, StorageClient, NBAStatsProvider

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
# Default location is a gitignored dir under the backend; override with
# CONTENT_IO_DIR (set to "off"/"false"/"0"/"none" to disable, e.g. in prod).
_BACKEND_ROOT = Path(__file__).resolve().parents[2]
_DEFAULT_IO_DIR = _BACKEND_ROOT / ".content_io"

_KEY_MOMENTS_PBP_MARKER = "FULL COMPRESSED PLAY-BY-PLAY:"


def _resolve_io_dir() -> Path | None:
    raw = os.environ.get("CONTENT_IO_DIR", "").strip().lower()
    if raw in {"0", "false", "off", "none"}:
        return None
    if raw:
        return Path(raw).expanduser()
    return _DEFAULT_IO_DIR


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
    def __init__(self, storage_client: StorageClient, nba_stats_provider: NBAStatsProvider):
        api_key = os.environ.get("OPENROUTER_API_KEY")

        if not api_key:
            raise RuntimeError("Missing OPENROUTER_API_KEY environment variable")

        self.client = OpenAI(api_key=api_key, base_url=OPENROUTER_BASE_URL)
        self.model = DEFAULT_MODEL
        self.storage_client = storage_client
        self.nba_stats_provider = nba_stats_provider

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
