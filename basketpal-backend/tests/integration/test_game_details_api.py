from tests.integration.conftest import FINAL_GAME_ID, IN_PROGRESS_GAME_ID, SCHEDULED_GAME_ID


def test_boxscore_without_delay(client):
    response = client.get(f"/games/{IN_PROGRESS_GAME_ID}/boxscore")
    assert response.status_code == 200
    assert response.json()["gameId"] == IN_PROGRESS_GAME_ID


def test_boxscore_with_delay_on_in_progress_game_does_not_crash(client):
    """Regression for H1/H2: this used to 500 on every live request because
    of the `datetime.time` import shadow and the dead None-check in
    RedisClient.get_snapshot (mirrored here by NullStorageClient)."""
    response = client.get(f"/games/{IN_PROGRESS_GAME_ID}/boxscore", params={"delay": 5})
    assert response.status_code == 200
    assert response.json()["gameId"] == IN_PROGRESS_GAME_ID


def test_boxscore_with_delay_on_game_with_no_snapshots_yet(client):
    """Regression for H2: get_snapshot on a game with zero saved snapshots
    used to raise IndexError instead of returning None."""
    response = client.get(f"/games/{SCHEDULED_GAME_ID}/boxscore", params={"delay": 5})
    assert response.status_code == 200


def test_boxscore_on_final_game_ignores_delay(client):
    response = client.get(f"/games/{FINAL_GAME_ID}/boxscore", params={"delay": 5})
    assert response.status_code == 200
    assert response.json()["gameStatus"] == 3


def test_boxscore_unknown_game_returns_404(client):
    response = client.get("/games/0000000000/boxscore")
    assert response.status_code == 404


def test_summary_returns_mock_content(client):
    response = client.get(f"/games/{FINAL_GAME_ID}/summary")
    assert response.status_code == 200
    assert "Nuggets" in response.json()


def test_model_comparison_returns_501_on_unsupported_provider(client):
    """Regression: MockContentProvider didn't implement get_model_comparison,
    so this raised a bare AttributeError (500) instead of the intended
    NotImplementedError -> 501."""
    response = client.get(f"/games/{FINAL_GAME_ID}/model-comparison")
    assert response.status_code == 501
