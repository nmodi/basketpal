from typing import Optional, Protocol, Tuple

from src.core.entities.game import GameSnapshot


class StorageClient(Protocol):
    def save_snapshot(self, game: GameSnapshot) -> None:
        ...

    def get_snapshot(self, game_id: str, delay: int) -> Optional[Tuple[GameSnapshot, float]]:
        ...

    def save(self, key: str, data: any) -> None:
        ...

    def save_with_ttl(self, key: str, data: any, ttl: int) -> None:
        ...

    def get(self, key: str) -> any:
        ...
