FROM ubuntu:22.04

RUN apt-get update && \
    apt-get install -y curl build-essential gcc make pkg-config libssl-dev

RUN curl https://sh.rustup.rs -sSf | sh -s -- -y

ENV PATH="/root/.cargo/bin:${PATH}"

WORKDIR /workspace

COPY . .

RUN cargo build --release

CMD ["./target/release/gateway"]
