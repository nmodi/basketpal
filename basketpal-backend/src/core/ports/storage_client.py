from typing import Protocol


class StorageClient(Protocol):
    def save_snapshot(self, game_id: str, data: dict) -> None:
        ...

    def get_snapshot(self, game_id: str) -> dict:
        ...

    def save(self, key: str, data: any) -> None:
        ...

    def get(self, key: str) -> any:
        ...
