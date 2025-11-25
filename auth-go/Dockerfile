# ---------- BUILD STAGE ----------
FROM golang:1.21-bullseye AS build

WORKDIR /app

# Install git and CA certificates
RUN apt-get update && \
    apt-get install -y --no-install-recommends git ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Copy only go.mod first to allow module download
COPY go.mod ./

# Download modules (go.sum will be generated inside container)
RUN go mod tidy

# Copy rest of the source
COPY . .

# Build static binary
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /auth-go ./cmd/server

# ---------- RUNTIME STAGE ----------
FROM debian:bookworm-slim

# Install CA certificates and Postgres client
RUN apt-get update && \
    apt-get install -y --no-install-recommends ca-certificates postgresql-client && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy binary
COPY --from=build /auth-go /auth-go

# Copy migrations
COPY --from=build /app/migrations /app/migrations

# Copy wait-for script
COPY wait-for-postgres.sh /wait-for-postgres.sh
RUN chmod +x /wait-for-postgres.sh

EXPOSE 8080

# Run binary after Postgres is ready
ENTRYPOINT ["/wait-for-postgres.sh", "postgres", "/auth-go"]

