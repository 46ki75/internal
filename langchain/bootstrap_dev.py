from src.app import app
import uvicorn  # type: ignore

if __name__ == "__main__":
    uvicorn.run("src.app:app", host="0.0.0.0", port=10002, reload=True)
