from fastapi import APIRouter, Depends, Request
from src.controllers.git_controller import GitController
from src.services.git_service import GitService
from typing import Any

router = APIRouter()


def get_git_service() -> GitService:
    return GitService()


def get_git_controller(service: GitService = Depends(get_git_service)) -> GitController:
    return GitController(service)


@router.get("/git")
def get_git(
    request: Request, controller: GitController = Depends(get_git_controller)
) -> dict[str, Any]:
    return controller.get_git(request)
