FROM amazonlinux:2023

RUN dnf update -y \
    && dnf install -y awscli \
    && dnf install -y findutils \
    && dnf install -y tar \
    && dnf install -y git \
    && git config --global --add safe.directory /workspaces/internal \
    && curl https://get.volta.sh | bash \
    && VOLTA_HOME="$HOME/.volta" PATH="$VOLTA_HOME/bin:$PATH" volta install node@20 

COPY .bashrc /root/.bashrc
