from typing import Any, Optional
from datetime import datetime
import uuid


class NormalResponse:
    def __init__(self) -> None:
        self.meta: dict[str, Any] = {"id": None, "totalPages": None, "timestamp": None}
        self.data: list[dict[str, Any]] = []
        self.links: dict[str, Optional[str]] = {
            "self": None,
            "first": None,
            "prev": None,
            "next": None,
            "last": None,
        }


class NormalResponseBuilder:
    def __init__(self) -> None:
        self.response = NormalResponse()

    def total_pages(self, total_pages: int) -> "NormalResponseBuilder":
        self.response.meta["totalPages"] = total_pages
        return self

    def data(self, data: list[dict[str, Any]]) -> "NormalResponseBuilder":
        self.response.data = data
        return self

    def push_data(self, data: dict[str, Any]) -> "NormalResponseBuilder":
        self.response.data.append(data)
        return self

    def self_link(self, link: str) -> "NormalResponseBuilder":
        self.response.links["self"] = link
        return self

    def first_link(self, link: str) -> "NormalResponseBuilder":
        self.response.links["first"] = link
        return self

    def prev_link(self, link: str) -> "NormalResponseBuilder":
        self.response.links["prev"] = link
        return self

    def next_link(self, link: str) -> "NormalResponseBuilder":
        self.response.links["next"] = link
        return self

    def last_link(self, link: str) -> "NormalResponseBuilder":
        self.response.links["last"] = link
        return self

    def build(self) -> dict[str, Any]:
        self.response.meta["id"] = str(uuid.uuid4())
        self.response.meta["timestamp"] = datetime.utcnow().isoformat() + "Z"
        return {
            "meta": self.response.meta,
            "data": self.response.data,
            "links": self.response.links,
        }
