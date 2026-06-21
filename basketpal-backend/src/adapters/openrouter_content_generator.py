import json
import logging
import os
import random
from concurrent.futures import ThreadPoolExecutor

from openai import OpenAI

from src.adapters.prompts import (
    SYSTEM_PROMPT,
    KEY_MOMENTS_SYSTEM_PROMPT,
    build_key_moments_prompt,
    build_story_prompt,
)
from src.common.formatting_utils import format_team_roster, format_pbp, format_period_scores
from src.core.ports import ContentProvider, StorageClient, NBAStatsProvider

logger = logging.getLogger(__name__)

OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
DEFAULT_MODEL = "deepseek/deepseek-v4-flash"
KEY_MOMENTS_FALLBACK_MODEL = "anthropic/claude-haiku-4.5"
STORY_FALLBACK_MODEL = "anthropic/claude-sonnet-4.6"

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
        key_moments = self._extract_key_moments(context["cleaned_pbp"])
        prompt = build_story_prompt(context, key_moments)

        recap = self._call_with_fallback(
            system=SYSTEM_PROMPT,
            prompt=prompt,
            models=[self.model, STORY_FALLBACK_MODEL],
            validate=lambda r: r.get("headline") and r.get("recap"),
            label="story",
        )
        recap["keyMoments"] = key_moments

        self.storage_client.save(key, recap)
        return recap

    def get_model_comparison(self, game_id, force_refresh: bool = False) -> list[dict]:
        key = f"game:{game_id}:model-comparison"

        if not force_refresh:
            cached = self.storage_client.get(key)
            if cached:
                return cached

        context = self._build_game_context(game_id)
        key_moments = self._extract_key_moments(context["cleaned_pbp"])
        prompt = build_story_prompt(context, key_moments)

        def run(label_and_model):
            label, model = label_and_model
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
                recap = self._parse_json(response.choices[0].message.content)
                return {"label": label, "model": model, **recap, "keyMoments": key_moments}
            except Exception:
                logger.exception("Model comparison failed for %s (%s)", label, model)
                return {
                    "label": label,
                    "model": model,
                    "headline": "Generation failed",
                    "recap": "This model did not return a usable recap.",
                    "keyMoments": [],
                    "playerOfTheGame": None,
                }

        with ThreadPoolExecutor(max_workers=len(COMPARISON_MODEL_SPECS)) as executor:
            results = list(executor.map(run, COMPARISON_MODEL_SPECS))

        random.shuffle(results)
        for i, result in enumerate(results):
            result["blindLabel"] = f"Recap {chr(65 + i)}"

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
            "cleaned_pbp": format_pbp(pbp),
            "game_type": game_type,
            "series_line": series_line,
        }

    def _extract_key_moments(self, cleaned_pbp: list[dict]) -> list[dict]:
        prompt = build_key_moments_prompt(cleaned_pbp)

        result = self._call_with_fallback(
            system=KEY_MOMENTS_SYSTEM_PROMPT,
            prompt=prompt,
            models=[self.model, KEY_MOMENTS_FALLBACK_MODEL],
            validate=lambda r: bool(r.get("keyMoments")),
            label="key moments",
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
    ) -> dict:
        last_exc = None
        for model in models:
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
                result = self._parse_json(response.choices[0].message.content)
                if validate(result):
                    return result
                last_exc = ValueError(f"Unusable {label} result from {model}")
                logger.warning("Unusable %s result from %s, trying fallback", label, model)
            except Exception as exc:
                logger.warning("%s generation failed with %s: %s", label.capitalize(), model, exc)
                last_exc = exc
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
