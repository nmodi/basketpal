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

MATCHUP_PREVIEW_SYSTEM_PROMPT = """
You are a sports journalist writing game previews for a basketball app.
Your writing style is energetic and specific — short punchy sentences,
active voice, concrete details. Think ESPN game preview, not a betting breakdown.

Rules you must follow:
- Use ONLY the player names provided in the data. Do not reference any other players.
- Use ONLY the records, standings, and statistics provided. Do not fabricate or infer stats.
- Do not describe players with attributes that could become outdated
  (age, years of experience, contract status, team history).
- The game has not happened yet. Never state or imply an outcome, final score, or that a play occurred.
  Write in present tense for current form and future tense for what to expect.
- Do not predict a specific final score or guarantee a winner.
- Surface the storylines: records, recent form, head-to-head, and what each team does well.
- Keep it tight — no filler, no clichés.
"""


def build_key_moments_prompt(cleaned_pbp: list[dict], scoring_runs: list[dict]) -> str:
    lead_change_plays = [e for e in cleaned_pbp if "lead_change" in e["tags"] or "tie" in e["tags"]]
    run_plays = [e for e in cleaned_pbp if "run" in e["tags"]]
    clutch_plays = [e for e in cleaned_pbp if "clutch" in e["tags"]]

    return f"""
Identify the 5-8 most narratively significant moments from this game.

PRE-FLAGGED CONTEXT (use these as strong signals):
- Lead changes occurred at these plays: {lead_change_plays}
- Scoring runs (8+ unanswered, ground truth): {scoring_runs}
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


def build_story_prompt(context: dict, key_moments: list[dict]) -> str:
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

SCORING RUNS (8+ unanswered points — ground truth, cite these figures directly):
{context['scoring_runs']}

KEY MOMENTS:
{key_moments}

OUTPUT FORMAT:
Return a JSON object with exactly these fields:
{{
  "headline": "string — punchy, specific, under 80 characters",
  "recap": "string — exactly 3 short paragraphs (4-6 sentences total, under 600 characters). Para 1: game summary and winner. Para 2: key turning point or run. Para 3: standout player and closing thought. Do NOT repeat yourself or restate the same point; stop once the recap is complete.",
  "playerOfTheGame": {{
    "name": "string — must appear in roster above",
    "reason": "string — one sentence, no unverifiable stats"
  }}
}}

Return ONLY the JSON object. No preamble, no explanation, no markdown fencing.
"""


def build_matchup_preview_prompt(context: dict) -> str:
    return f"""
Write a game preview for the following matchup.

GAME: {context['home_team']} (home) vs {context['away_team']} (away)
GAME TYPE: {context['game_type']}{context['series_line']}
TIPOFF: {context['game_time']}

STANDINGS & RECORDS:
- {context['home_team']}: {context['home_record']} | {context['home_standings']} | Last 10: {context['home_last10']} | Streak: {context['home_streak']} | Home: {context['home_home_record']}
- {context['away_team']}: {context['away_record']} | {context['away_standings']} | Last 10: {context['away_last10']} | Streak: {context['away_streak']} | Road: {context['away_road_record']}

RECENT FORM (most recent first):
- {context['home_team']}: {context['home_form']}
- {context['away_team']}: {context['away_form']}

HEAD-TO-HEAD THIS SEASON:
{context['h2h']}

TEAM SEASON AVERAGES:
- {context['home_team']}: {context['home_team_stats']}
- {context['away_team']}: {context['away_team_stats']}

KEY PLAYERS (season averages):
- {context['home_team']}: {context['home_leaders']}
- {context['away_team']}: {context['away_leaders']}

ROSTERS:
- {context['home_team']}: {context['home_roster']}
- {context['away_team']}: {context['away_roster']}

INJURIES:
- {context['home_team']}: {context['home_injuries']}
- {context['away_team']}: {context['away_injuries']}

OUTPUT FORMAT:
Return a JSON object with exactly these fields:
{{
  "headline": "string — punchy, specific, under 80 characters",
  "preview": "string — exactly 3 short paragraphs (4-6 sentences total, under 600 characters). Para 1: matchup stakes and records. Para 2: recent form and head-to-head storyline. Para 3: players to watch and what to expect. Do not repeat yourself; stop once complete.",
  "playersToWatch": [
    {{ "name": "string — must appear in rosters above", "reason": "string — one sentence, no unverifiable stats" }}
  ],
  "storylines": [
    "string — one narrative thread worth watching"
  ]
}}

Return ONLY the JSON object. No preamble, no explanation, no markdown fencing.
"""
