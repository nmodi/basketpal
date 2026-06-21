import json
import logging
import os
import random
from concurrent.futures import ThreadPoolExecutor

import requests
from openai import OpenAI

from src.common.formatting_utils import format_team_roster, format_pbp, format_period_scores
from src.core.ports import ContentProvider, StorageClient, NBAStatsProvider

logger = logging.getLogger(__name__)

OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
OPENROUTER_MODELS_URL = f"{OPENROUTER_BASE_URL}/models"
DEFAULT_MODEL = "openai/gpt-4o-mini"

SYSTEM_PROMPT = """
You are a sports journalist writing game recaps for a basketball app.
Your writing style is energetic and specific — short punchy sentences,
active voice, concrete details. Think ESPN game recap, not a color commentary transcript.

Rules you must follow:
- Use ONLY the player names provided in the rosters. Do not reference any other players.
- Use ONLY the final score provided. Do not infer or calculate scores from play-by-play.
- Do not describe players with attributes that could become outdated
  (age, years of experience, contract status, team history).
- Do not fabricate statistics. If a stat isn't explicitly in the data, don't cite it.
- Do not narrate every play. Extract the narrative — the runs, the turning points,
  the player who took over.
- Write in past tense throughout.
"""

KEY_MOMENTS_SYSTEM_PROMPT = """
You are a basketball analyst extracting the narratively significant moments from a game's play-by-play.

Rules you must follow:
- Use ONLY the player names that appear in the play-by-play provided. Do not reference any other players.
- Do not fabricate statistics or scores. If a value isn't explicitly in the data, don't cite it.
- Each moment must correspond to an actual play in the provided play-by-play.
"""

# Models to pit against each other in the model-comparison view. Entries with a
# string are pinned to that exact OpenRouter slug; entries with a callable are
# resolved at request time to whichever matching model OpenRouter most recently
# published, since some providers (GLM, DeepSeek, Qwen) don't publish a stable
# "-latest" alias the way OpenAI/Anthropic/Google do.
COMPARISON_MODEL_SPECS = [
    ("GPT-4o", "openai/gpt-4o"),
    ("GPT (latest)", "~openai/gpt-latest"),
    ("Claude Sonnet (latest)", "~anthropic/claude-sonnet-latest"),
    ("Claude Haiku (latest)", "~anthropic/claude-haiku-latest"),
    ("GLM (latest)", lambda model_id: model_id.startswith("z-ai/glm")),
    ("Gemini (latest)", "~google/gemini-pro-latest"),
    ("DeepSeek (latest)", lambda model_id: model_id.startswith("deepseek/")),
    ("Qwen (latest)", lambda model_id: model_id.startswith("qwen/")),
]


class OpenRouterContentProvider(ContentProvider):
    def __init__(self, storage_client: StorageClient, nba_stats_provider: NBAStatsProvider):
        api_key = os.environ.get("OPENROUTER_API_KEY")

        if not api_key:
            raise RuntimeError("Missing OPENROUTER_API_KEY environment variable")

        self.api_key = api_key
        self.client = OpenAI(api_key=api_key, base_url=OPENROUTER_BASE_URL)
        self.model = os.environ.get("OPENROUTER_MODEL", DEFAULT_MODEL)
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
        prompt = self._build_story_prompt(context, key_moments)

        response = self.client.chat.completions.create(
            model=self.model,
            temperature=0.5,
            max_tokens=1500,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
        )
        recap = self._parse_json(response.choices[0].message.content)
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
        prompt = self._build_story_prompt(context, key_moments)
        resolved_models = self._resolve_comparison_models()

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

        with ThreadPoolExecutor(max_workers=len(resolved_models)) as executor:
            results = list(executor.map(run, resolved_models))

        random.shuffle(results)
        for i, result in enumerate(results):
            result["blindLabel"] = f"Recap {chr(65 + i)}"

        self.storage_client.save(key, results)

        return results

    def _resolve_comparison_models(self) -> list[tuple[str, str]]:
        catalog = None
        if any(callable(spec) for _, spec in COMPARISON_MODEL_SPECS):
            response = requests.get(
                OPENROUTER_MODELS_URL,
                headers={"Authorization": f"Bearer {self.api_key}"},
            )
            response.raise_for_status()
            catalog = sorted(response.json()["data"], key=lambda m: m["created"], reverse=True)

        resolved = []
        for label, spec in COMPARISON_MODEL_SPECS:
            if callable(spec):
                match = next((m["id"] for m in catalog if spec(m["id"])), None)
                if match is None:
                    raise RuntimeError(f"No OpenRouter model found for {label}")
                resolved.append((label, match))
            else:
                resolved.append((label, spec))

        return resolved

    def _build_game_context(self, game_id):
        pbp = self.nba_stats_provider.get_playbyplay(game_id)
        game = self.nba_stats_provider.get_boxscore(game_id)

        home_team_id = game.homeTeam.teamId
        visitor_team_id = game.awayTeam.teamId

        home_roster = self.nba_stats_provider.get_roster(home_team_id)
        away_roster = self.nba_stats_provider.get_roster(visitor_team_id)

        cleaned_home_roster = format_team_roster(home_roster)
        cleaned_visitor_roster = format_team_roster(away_roster)

        cleaned_pbp = format_pbp(pbp)

        home_team_city = game.homeTeam.teamCity
        home_team_name = game.homeTeam.teamName
        home_team_score = game.homeTeam.score if game.homeTeam.score is not None else sum(game.homeTeam.periodScores)
        home_team = f"{home_team_city} {home_team_name}"

        away_team_city = game.awayTeam.teamCity
        away_team_name = game.awayTeam.teamName
        away_team_score = game.awayTeam.score if game.awayTeam.score is not None else sum(game.awayTeam.periodScores)
        away_team = f"{away_team_city} {away_team_name}"

        cleaned_period_scores = format_period_scores(home_team, game.homeTeam.periodScores, away_team, game.awayTeam.periodScores)

        game_type = self._get_game_type(game_id)
        series_line = f"\nSERIES: {game.seriesText}" if game.seriesText else ""

        return {
            "home_team": home_team,
            "away_team": away_team,
            "home_team_score": home_team_score,
            "away_team_score": away_team_score,
            "cleaned_home_roster": cleaned_home_roster,
            "cleaned_visitor_roster": cleaned_visitor_roster,
            "cleaned_period_scores": cleaned_period_scores,
            "cleaned_pbp": cleaned_pbp,
            "game_type": game_type,
            "series_line": series_line,
        }

    def _extract_key_moments(self, cleaned_pbp: list[dict]) -> list[dict]:
        lead_change_plays = [e for e in cleaned_pbp if "lead_change" in e["tags"] or "tie" in e["tags"]]
        run_plays = [e for e in cleaned_pbp if "run" in e["tags"]]
        clutch_plays = [e for e in cleaned_pbp if "clutch" in e["tags"]]

        prompt = f"""
Identify the 5-8 most narratively significant moments from this game.

PRE-FLAGGED CONTEXT (use these as strong signals):
- Lead changes occurred at these plays: {lead_change_plays}
- Scoring runs of 6+: {run_plays}
- Clutch time plays (final 2 min): {clutch_plays}

FULL COMPRESSED PLAY-BY-PLAY:
{cleaned_pbp}

OUTPUT FORMAT:
Return a JSON object with exactly this field:
{{
  "keyMoments": [
    {{
      "quarter": number,
      "time": "string — clock time of the play, e.g. '08:42'",
      "player": "string — player involved in the play",
      "description": "string — one sentence, specific and narrative",
      "momentType": "string — e.g. lead_change, run, clutch, turning_point"
    }}
  ]
}}

Return ONLY the JSON object. No preamble, no explanation, no markdown fencing.
"""

        response = self.client.chat.completions.create(
            model=self.model,
            temperature=0.5,
            max_tokens=1500,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": KEY_MOMENTS_SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
        )
        return self._parse_json(response.choices[0].message.content)["keyMoments"]

    def _build_story_prompt(self, context: dict, key_moments: list[dict]) -> str:
        return f"""
Write a game recap for the following game.

GAME TYPE: {context['game_type']}{context['series_line']}

TEAMS:
- Home: {context['home_team']} | Roster: {context['cleaned_home_roster']}
- Away: {context['away_team']} | Roster: {context['cleaned_visitor_roster']}

FINAL SCORE:
{context['home_team']} {context['home_team_score']}, {context['away_team']} {context['away_team_score']}

QUARTER-BY-QUARTER SCORING:
{context['cleaned_period_scores']}

KEY MOMENTS:
{key_moments}

OUTPUT FORMAT:
Return a JSON object with exactly these fields:
{{
  "headline": "string — punchy, specific, under 80 characters",
  "recap": "string — 3 paragraphs. Para 1: game summary and winner. Para 2: key turning point or run. Para 3: standout player and closing thought",
  "playerOfTheGame": {{
    "name": "string — must appear in roster above",
    "reason": "string — one sentence, no unverifiable stats"
  }}
}}

Return ONLY the JSON object. No preamble, no explanation, no markdown fencing.
"""

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
