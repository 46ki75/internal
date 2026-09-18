FROM mcr.microsoft.com/devcontainers/base:debian

SHELL ["/bin/bash", "-o", "pipefail", "-c"]

RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential cmake pkg-config libssl-dev \
    && rm -rf /var/lib/apt/lists/*

ARG MISE_VERSION=2026.9.9
RUN arch="$(uname -m)" \
    && case "$arch" in x86_64) arch=x64 ;; aarch64) arch=arm64 ;; esac \
    && curl -fsSL "https://github.com/jdx/mise/releases/download/v${MISE_VERSION}/mise-v${MISE_VERSION}-linux-${arch}" -o /usr/local/bin/mise \
    && chmod +x /usr/local/bin/mise
USER vscode
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \
    | sh -s -- -y --default-toolchain none --profile minimal --no-modify-path
USER root
ENV PATH="/home/vscode/.cargo/bin:/home/vscode/.local/share/mise/shims:${PATH}"
