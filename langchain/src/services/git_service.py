from typing import Any


class GitService:
    def status(self) -> dict[str, Any]:
        return {"serviceNeme": "Git"}
