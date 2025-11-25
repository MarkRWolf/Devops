#!/bin/sh
set -e

host="$1"
shift
cmd="$@"

until pg_isready -h "$host" -U "${POSTGRES_USER:-postgres}" > /dev/null 2>&1; do
  echo "Waiting for Postgres at $host..."
  sleep 1
done

echo "Applying database migrations..."
psql "$DATABASE_URL" -f /app/migrations/0001_init.sql

exec $cmd

