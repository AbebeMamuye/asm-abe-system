# ===================================================
# Dockerfile for Asset Management System (ASM / AMIS)
# Multi-stage production build with SQLite persistence
# ===================================================

FROM node:20-bookworm-slim AS builder

WORKDIR /app

# Install native compile tools for better-sqlite3
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source and build
COPY . .
RUN npm run web:build

# ===================================================
# Production Runner
# ===================================================
FROM node:20-bookworm-slim AS runner

WORKDIR /app

# Native dependencies for running compiled better-sqlite3
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install --omit=dev

# Copy compiled bundles from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/dist-server ./dist-server

# Persistent storage mount point for SQLite database
RUN mkdir -p /app/data

ENV NODE_ENV=production
ENV PORT=5002
ENV AMS_PORT=5002

EXPOSE 5002

# Mount volume to persist database between container restarts
VOLUME ["/app/data"]

CMD ["node", "dist-server/server.js"]

