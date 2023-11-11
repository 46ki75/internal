from fastapi import FastAPI, Request
from src.routers import git_router
from src.routers import main_router

app = FastAPI()

app.include_router(main_router.router, prefix="/api/langchain")
app.include_router(git_router.router, prefix="/api/langchain")


if __name__ == "__main__":
    import uvicorn  # type: ignore

    uvicorn.run(app, host="0.0.0.0", port=10002)
