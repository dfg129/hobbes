FROM rust:latest as builder
WORKDIR /usr/src/s3events
COPY . .
# RUN cargo install --path .
RUN cargo build

FROM debian:buster-slim
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates
WORKDIR /var/task/
COPY --from=builder /usr/src/s3events/target/debug/bootstrap /usr/local/bin/bootstrap
CMD [ "bootstrap" ]
