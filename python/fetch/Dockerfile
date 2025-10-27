FROM python:3.13-slim

ENV LAMBDA_TASK_ROOT=/var/task
ENV LAMBDA_RUNTIME_DIR=/var/runtime
ENV PLAYWRIGHT_BROWSERS_PATH=/opt/ms-playwright
ENV HOME=/tmp

RUN apt-get update && \
    apt-get install -y \
    libxml2-dev \
    libxslt-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /var/task

RUN pip install --no-cache-dir \
    playwright \
    awslambdaric

RUN PLAYWRIGHT_BROWSERS_PATH=/opt/ms-playwright playwright install chromium --with-deps 

COPY pyproject.toml pyproject.toml

RUN pip install --no-cache-dir .

COPY . .

RUN python main.py

ENTRYPOINT ["/usr/local/bin/python", "-m", "awslambdaric"]
CMD ["main.handler"]
