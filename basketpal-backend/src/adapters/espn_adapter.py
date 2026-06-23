"""ESPN injuries provider.

ESPN exposes an unauthenticated injuries feed that the NBA stats endpoints do
not cover. It is a distinct external source (different host, header set, and
payload shape from stats.nba.com), so it lives in its own adapter implementing
InjuriesProvider rather than being bolted onto NBAAPIStatsProvider.
"""

import logging

import requests
from requests.exceptions import RequestException

from src.core.entities.leagues import League
from src.core.ports.injuries_provider import InjuriesProvider

logger = logging.getLogger(__name__)

# ESPN's public site API accepts a browser-ish UA; a bare default gets through
# but keep an explicit header set for parity with the other adapters.
_ESPN_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.5",
}

# Path segment differs by league; the NBA/WNBA sport trees are separate.
_LEAGUE_PATH = {
    League.NBA: "nba",
    League.WNBA: "wnba",
}


class ESPNInjuriesProvider(InjuriesProvider):
    """Fetches current injury/availability reports from ESPN's site API."""

    def get_injuries(self, league: League) -> list[dict]:
        sport = _LEAGUE_PATH.get(league)
        if sport is None:
            logger.warning("Injuries not supported for league %s", league)
            return []

        url = f"https://site.api.espn.com/apis/site/v2/sports/basketball/{sport}/injuries"
        try:
            resp = requests.get(url, headers=_ESPN_HEADERS, timeout=10)
            resp.raise_for_status()
            data = resp.json()
        except (RequestException, ValueError) as exc:
            logger.warning("ESPN injuries feed unavailable for %s: %s", league.code, exc)
            return []

        rows = []
        for item in data.get("items", []):
            team = item.get("team") or {}
            team_tricode = team.get("abbreviation")
            for injury in item.get("injuries") or []:
                rows.append(self._normalize_injury(injury, team_tricode))
        return rows

    @staticmethod
    def _normalize_injury(injury: dict, team_tricode: str | None) -> dict:
        athlete = injury.get("athlete") or {}

        # The injury status (Out / Day To Day / Questionable / etc.) and the
        # injury type (Ankle / Knee / etc.) nest under a couple of possible
        # keys depending on payload revision — read defensively and degrade.
        status = None
        for status_entry in injury.get("injuryStatus") or []:
            status = status_entry.get("type") or status_entry.get("name") or status
        if status is None:
            status = (injury.get("status") or {}).get("name")

        inner = (injury.get("injuries") or [{}])[0]
        injury_type = (inner.get("type") or {}).get("description")
        return_type = (inner.get("returnType") or {}).get("name")

        return {
            "team_tricode": team_tricode,
            "player_name": athlete.get("displayName"),
            "status": status,
            "injury_type": injury_type,
            "return_type": return_type,
        }
