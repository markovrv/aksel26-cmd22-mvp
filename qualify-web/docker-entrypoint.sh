#!/bin/bash
set -e

# PostgreSQL configuration
export PG_VERSION="${PG_VERSION:-$(ls /usr/lib/postgresql | sort -V | tail -n 1)}"
export PG_BIN="/usr/lib/postgresql/$PG_VERSION/bin"
export PG_DATA="${PG_DATA:-/var/lib/postgresql/data}"

export PATH="$PG_BIN:$PATH"

# Ensure proper permissions
mkdir -p "$PG_DATA"
chown -R postgres:postgres /var/lib/postgresql

if [ ! -s "$PG_DATA/PG_VERSION" ]; then
    echo "[INIT] Creating PostgreSQL data directory..."
    su - postgres -c "$PG_BIN/initdb -D '$PG_DATA' --encoding=UTF8 --locale=C.UTF-8"
fi

echo "[INIT] Starting PostgreSQL..."
su - postgres -c "$PG_BIN/pg_ctl -D '$PG_DATA' -o '-c listen_addresses=localhost' -w start"

# Wait for PostgreSQL to be ready
for i in $(seq 1 30); do
    if pg_isready -h localhost -p 5432 -U postgres -q 2>/dev/null; then
        break
    fi
    sleep 1
done

echo "[INIT] PostgreSQL is ready."

# Get database credentials from environment or use defaults
DB_NAME="${DB_NAME:-qualify}"
DB_USER="${DB_USER:-qualify}"
DB_PASS="${DB_PASS:-qualify}"

# Create database user and database if not exists
echo "[INIT] Creating database user and database..."
su - postgres -c "psql -c \"SELECT 1 FROM pg_roles WHERE rolname='$DB_USER';\"" | grep -q 1 || \
    su - postgres -c "psql -c \"CREATE ROLE $DB_USER WITH LOGIN PASSWORD '$DB_PASS';\"" 2>/dev/null || true

su - postgres -c "psql -c \"SELECT 1 FROM pg_database WHERE datname='$DB_NAME';\"" | grep -q 1 || \
    su - postgres -c "createdb -O $DB_USER $DB_NAME" 2>/dev/null || true

su - postgres -c "psql -d $DB_NAME -v ON_ERROR_STOP=1 -c \"ALTER DATABASE $DB_NAME OWNER TO $DB_USER; ALTER SCHEMA public OWNER TO $DB_USER; GRANT ALL ON SCHEMA public TO $DB_USER;\"" 2>/dev/null || true

# Run SQL init scripts
if [ -d /docker-entrypoint-initdb.d ]; then
    echo "[INIT] Running SQL init scripts..."
    for f in /docker-entrypoint-initdb.d/*.sql; do
        if [ -f "$f" ]; then
            echo "[INIT] Running $f..."
            su - postgres -c "psql -d $DB_NAME -v ON_ERROR_STOP=1 -c \"SET ROLE $DB_USER\" -f $f"
        fi
    done
fi

# Export database connection settings for the backend
export DB_NAME="$DB_NAME"
export DB_USER="$DB_USER"
export DB_PASS="$DB_PASS"
export DB_HOST="localhost"
export DB_PORT="5432"

# Start the backend
echo "[INIT] Starting backend..."
cd /app
exec uvicorn main:app --host 0.0.0.0 --port 8000
