from typing import Protocol


class ContentProvider(Protocol):
    def get_game_summary(self, game_id) -> str:
        ...
