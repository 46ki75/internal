from fastapi import APIRouter, Request, Depends
from typing import Any
from src.services.git_service import GitService
from src.models.response_builder import NormalResponseBuilder


class GitController:
    router = APIRouter()

    def __init__(self, service: GitService):
        self.service = service

    def get_git(self, reqest: Request) -> dict[str, Any]:
        data = self.service.status()
        response = (
            NormalResponseBuilder()
            .push_data(data)
            .self_link(reqest.url_for("get_git"))
            .build()
        )
        return response
