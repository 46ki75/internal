from fastapi import FastAPI, Request
from pydantic import BaseModel
import os
import time

app = FastAPI()

start_time = time.time()


class NormalResponse(BaseModel):
    data: dict
    links: dict


def build_normal_response(data: dict, self_link: str) -> NormalResponse:
    return NormalResponse(data=data, links={"self": self_link})


@app.get("/api/langchain")
def get_langchain(request: Request) -> NormalResponse:
    response_data = {"message": "Hello, Langchain!"}
    return build_normal_response(response_data, request.url_for("get_langchain"))


@app.get("/api/langchain/up")
def get_up(request: Request) -> NormalResponse:
    uptime_seconds = time.time() - start_time
    response_data = {
        "status": "up",
        "uptime": str(int(uptime_seconds)) + "s",
        "hostname": os.getenv("HOSTNAME", "unknown"),
        "time": time.strftime("%Y-%m-%d %H:%M:%S", time.gmtime()),
    }
    return build_normal_response(response_data, request.url_for("get_up"))


if __name__ == "__main__":
    import uvicorn  # type: ignore

    uvicorn.run(app, host="0.0.0.0", port=10002)
