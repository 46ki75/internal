from flask import Flask

app = Flask(__name__)


@app.route("/")
def hello_world() -> str:
    return "Hello, World!"


@app.route("/api/langchain")
def get_langchain() -> str:
    return "Hello, Lnagchain!"


@app.route("/api/langchain/gpt")
def get_langchain_gpt() -> str:
    return "Hello, Lnagchain/GPT!"


if __name__ == "__main__":
    app.run(debug=True, port=10002)
