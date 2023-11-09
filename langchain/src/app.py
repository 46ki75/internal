from flask import Flask, jsonify, Response, request
from models.ResponseBuilder import NormalResponseBuilder
import os
import time

app = Flask(__name__)

start_time = time.time()


@app.route("/api/langchain")
def get_langchain() -> Response:
    response = (
        NormalResponseBuilder()
        .push_data({"message": "Hello, Langchain!"})
        .self_link(request.url)
        .build()
    )
    return jsonify(response)


@app.route("/api/langchain/up")
def get_up() -> Response:
    uptime_seconds = time.time() - start_time
    response = (
        NormalResponseBuilder()
        .push_data(
            {
                "status": "up",
                "uptime": str(int(uptime_seconds)) + "s",
                "hostname": os.getenv("HOSTNAME", "unknown"),
                "time": time.strftime("%Y-%m-%d %H:%M:%S", time.gmtime()),
            }
        )
        .self_link(request.url)
        .build()
    )

    return jsonify(response)


if __name__ == "__main__":
    app.run(debug=True, port=10002)
