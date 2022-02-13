FROM rust:latest as builder
WORKDIR /usr/src/dynamodb
COPY . .
RUN cargo install --path .
RUN cargo build --release

FROM debian:buster-slim
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates
WORKDIR /var/task/
COPY --from=builder /usr/src/dynamodb/target/release/bootstrap /usr/local/bin/bootstrap
CMD [ "bootstrap" ]
