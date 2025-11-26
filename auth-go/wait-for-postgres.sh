#!/bin/sh
set -e

host="$1"
shift
cmd="$@"

until PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$host" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c '\q' 2>/dev/null; do
  echo "Waiting for Postgres at $host..."
  sleep 1
done

echo "Postgres is UP at $host — running command..."
exec $cmd

