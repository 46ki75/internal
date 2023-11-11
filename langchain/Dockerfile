# Pythonのベースイメージを使用
FROM python:3.10

# 作業ディレクトリを設定
WORKDIR /workspace

# 依存関係のファイルをコピー
COPY pyproject.toml poetry.lock* /workspace/

# Poetryをインストール
RUN pip install poetry \
    && poetry config virtualenvs.create false

# 依存関係をインストール
RUN poetry install

# アプリケーションのコードをコピー
COPY . /workspace

# プロジェクトを開始するコマンド
CMD ["python3", "bootstrap.py"]
