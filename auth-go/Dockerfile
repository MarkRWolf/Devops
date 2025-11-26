# ---------- BUILD STAGE ----------
FROM golang:1.21-bullseye AS build
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends git ca-certificates && rm -rf /var/lib/apt/lists/*
COPY go.mod ./
RUN go mod tidy
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /auth-go ./cmd/server

# ---------- RUNTIME STAGE ----------
FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates postgresql-client wget && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build /auth-go /auth-go
COPY --from=build /app/migrations /app/migrations
COPY wait-for-postgres.sh /wait-for-postgres.sh
RUN chmod +x /wait-for-postgres.sh
EXPOSE 8080
ENTRYPOINT ["/wait-for-postgres.sh", "auth-db", "/auth-go"]

