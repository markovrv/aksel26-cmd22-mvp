# ---- Build frontend ----
FROM node:20-alpine AS frontend-builder

WORKDIR /app
COPY front/package*.json .
RUN npm ci
COPY front/ .
RUN npm run build

# ---- Final image ----
FROM python:3.12-slim

# Install PostgreSQL
RUN apt-get update && apt-get install -y --no-install-recommends \
    postgresql postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Remove default PostgreSQL cluster created by package installation.
# Debian may ship different PostgreSQL versions depending on the base image date.
RUN for version in /usr/lib/postgresql/*; do \
        pg_version="$(basename "$version")"; \
        pg_dropcluster --stop "$pg_version" main 2>/dev/null || true; \
    done

# Install Python dependencies
WORKDIR /app
COPY back/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY back/ .

# Copy SQL init scripts
COPY create.sql insert.sql /docker-entrypoint-initdb.d/

# Copy built frontend to static folder
RUN mkdir -p /app/static
COPY --from=frontend-builder /app/dist /app/static

# Create images directory
RUN mkdir -p /app/images

# Copy entrypoint
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN sed -i 's/\r$//' /docker-entrypoint.sh && chmod +x /docker-entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["/docker-entrypoint.sh"]
