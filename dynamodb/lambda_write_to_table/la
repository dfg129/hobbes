FROM rust:1.58.0 as builder
WORKDIR /usr/src/dynamodb_create
COPY . .
RUN cargo install --path .
RUN cargo build --release

FROM debian:buster-slim
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates
WORKDIR /var/task/
COPY --from=builder /usr/src/dynamodb_create/target/release/bootstrap /usr/local/bin/bootstrap
CMD [ "bootstrap" ]
