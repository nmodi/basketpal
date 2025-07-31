from typing import Protocol

from src.core.entities.game import GameSnapshot


class StorageClient(Protocol):
    def save_snapshot(self, game: GameSnapshot) -> None:
        ...

    def get_snapshot(self, game_id: str) -> GameSnapshot:
        ...

    def save(self, key: str, data: any) -> None:
        ...

    def get(self, key: str) -> any:
        ...
