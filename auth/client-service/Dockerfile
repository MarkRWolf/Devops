# Use a minimal base image
FROM golang:1.21-alpine AS builder

# Set necessary environment variables
ENV CGO_ENABLED=0 GOOS=linux

WORKDIR /app

# Copy the go.mod and go.sum files
COPY go.mod .
COPY go.sum .

# Download dependencies
RUN go mod download

# Copy the source code
COPY . .

# Build the application
RUN go build -a -installsuffix cgo -o go-client main.go

# --- Final lightweight image ---
FROM alpine:latest
WORKDIR /root/
COPY --from=builder /app/go-client .
EXPOSE 8080
CMD ["./go-client"]
