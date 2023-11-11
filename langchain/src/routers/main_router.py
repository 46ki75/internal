from fastapi import APIRouter, Depends, Request

import os
import time
from typing import Any
from src.models.response_builder import NormalResponseBuilder

router = APIRouter()

start_time = time.time()


@router.get("/")
def get_langchain(request: Request) -> dict[str, Any]:
    response = (
        NormalResponseBuilder()
        .push_data({"message": "Hello, Langchain!"})
        .self_link(request.url_for("get_langchain"))
        .build()
    )
    return response


@router.get("/up")
def get_up(request: Request) -> dict[str, Any]:
    uptime_seconds = time.time() - start_time
    response_data = {
        "status": "up",
        "uptime": str(int(uptime_seconds)) + "s",
        "hostname": os.getenv("HOSTNAME", "unknown"),
        "time": time.strftime("%Y-%m-%d %H:%M:%S", time.gmtime()),
    }
    response = (
        NormalResponseBuilder()
        .push_data(response_data)
        .self_link(request.url_for("get_up"))
        .build()
    )
    return response
