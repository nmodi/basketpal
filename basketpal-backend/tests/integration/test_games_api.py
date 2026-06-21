def test_upcoming_games_returns_200(client):
    response = client.get("/games/upcoming", params={"league": "nba"})
    assert response.status_code == 200
    assert isinstance(response.json(), list)
