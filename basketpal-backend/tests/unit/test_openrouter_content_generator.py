from unittest.mock import MagicMock

import pytest

from src.adapters.openrouter_content_generator import OpenRouterContentProvider


@pytest.fixture
def provider(monkeypatch):
    monkeypatch.setenv("OPENROUTER_API_KEY", "test-key")
    return OpenRouterContentProvider(storage_client=MagicMock(), nba_stats_provider=MagicMock())


_FAKE_CATALOG = [
    {"id": "openai/gpt-4o", "created": 1},
    {"id": "openai/gpt-5", "created": 30},
    {"id": "openai/gpt-5-mini", "created": 20},
    {"id": "anthropic/claude-sonnet-4-6", "created": 25},
    {"id": "anthropic/claude-haiku-4-5", "created": 15},
    {"id": "google/gemini-pro-2.5", "created": 10},
    {"id": "z-ai/glm-4.6", "created": 5},
    {"id": "deepseek/deepseek-v3", "created": 8},
    {"id": "qwen/qwen3-max", "created": 6},
]


def _mock_catalog_response(monkeypatch):
    response = MagicMock()
    response.json.return_value = {"data": _FAKE_CATALOG}
    response.raise_for_status.return_value = None
    get = MagicMock(return_value=response)
    monkeypatch.setattr("src.adapters.openrouter_content_generator.requests.get", get)
    return get


def test_resolve_comparison_models_strips_tilde_prefix(provider, monkeypatch):
    """Regression for H3: tilde-prefixed specs were appended to the resolved
    list verbatim (e.g. "~openai/gpt-latest"), which isn't a valid OpenRouter
    slug and made every request for that model fail."""
    _mock_catalog_response(monkeypatch)

    resolved = provider._resolve_comparison_models()

    resolved_ids = [model_id for _, model_id in resolved]
    assert not any(model_id.startswith("~") for model_id in resolved_ids)


def test_resolve_comparison_models_picks_most_recently_created(provider, monkeypatch):
    _mock_catalog_response(monkeypatch)

    resolved = dict(provider._resolve_comparison_models())

    assert resolved["GPT (latest)"] == "openai/gpt-5"
    assert resolved["Claude Sonnet (latest)"] == "anthropic/claude-sonnet-4-6"
    assert resolved["Claude Haiku (latest)"] == "anthropic/claude-haiku-4-5"
    assert resolved["Gemini (latest)"] == "google/gemini-pro-2.5"
    assert resolved["GLM (latest)"] == "z-ai/glm-4.6"


def test_resolve_comparison_models_keeps_plain_strings_pinned(provider, monkeypatch):
    _mock_catalog_response(monkeypatch)

    resolved = dict(provider._resolve_comparison_models())

    assert resolved["GPT-4o"] == "openai/gpt-4o"


def test_resolve_comparison_models_fetches_catalog_with_timeout(provider, monkeypatch):
    get = _mock_catalog_response(monkeypatch)

    provider._resolve_comparison_models()

    _, kwargs = get.call_args
    assert kwargs.get("timeout") is not None


def test_resolve_comparison_models_raises_when_no_match(provider, monkeypatch):
    response = MagicMock()
    response.json.return_value = {"data": []}
    response.raise_for_status.return_value = None
    monkeypatch.setattr(
        "src.adapters.openrouter_content_generator.requests.get",
        MagicMock(return_value=response),
    )

    with pytest.raises(RuntimeError):
        provider._resolve_comparison_models()
