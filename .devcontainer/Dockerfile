FROM mcr.microsoft.com/devcontainers/base:debian

USER vscode

ARG HOME=/home/vscode

RUN mkdir -p ~/.aws

COPY ./config ${HOME}/.aws/config

RUN echo 'eval "$(starship init bash)"' >> ~/.bashrc
