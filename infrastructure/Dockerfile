# ==============================================================================
# STAGE 1: Build Frontend Assets
# ==============================================================================
FROM node:22-slim AS frontend-builder
WORKDIR /usr/src/app

# Copy monorepo workspace manifests only (no lockfile - lockfile was built on Windows
# and pins Windows-specific @rolldown/binding-win32-x64-msvc native binaries which
# cannot load on Linux. Fresh install ensures correct Linux native binaries.)
COPY package.json ./
COPY apps/web/package.json ./apps/web/
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies with fresh resolution for the correct Linux platform
RUN npm install --legacy-peer-deps

# Copy source code
COPY packages/shared/ ./packages/shared/
COPY apps/web/ ./apps/web/

# Build React app: run vite from the apps/web directory using the absolute binary path
# This guarantees vite (and rolldown) are found regardless of PATH
WORKDIR /usr/src/app/apps/web
RUN /usr/src/app/node_modules/.bin/vite build

# ==============================================================================
# STAGE 2: Build Backend Dependencies
# ==============================================================================
FROM node:22-slim AS backend-builder
WORKDIR /usr/src/app

COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/

RUN npm install --omit=dev --legacy-peer-deps

# ==============================================================================
# STAGE 3: Final Runtime Image
# ==============================================================================
FROM python:3.10-slim-bookworm
WORKDIR /usr/src/app

# 1. Install Node.js, PM2, and system libraries required for OpenCV
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    gnupg \
    build-essential \
    libgl1 \
    libglib2.0-0 \
    && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g pm2 \
    && rm -rf /var/lib/apt/lists/*

# 2. Install Python AI/ML dependencies
COPY apps/ai/requirements.txt ./apps/ai/
RUN pip install --no-cache-dir -r ./apps/ai/requirements.txt

# 3. Copy shared libraries & backend code
COPY packages/shared/ ./packages/shared/
COPY --from=backend-builder /usr/src/app/node_modules/ ./node_modules/
COPY apps/api/ ./apps/api/

# 4. Copy built React frontend static assets
COPY --from=frontend-builder /usr/src/app/apps/web/dist/ ./apps/web/dist/

# 5. Copy FastAPI Python files
COPY apps/ai/ ./apps/ai/

# 6. Copy PM2 ecosystem config
COPY infrastructure/ecosystem.config.js ./infrastructure/ecosystem.config.js

# 7. Create directory structure for logs
RUN mkdir -p logs/api logs/ai logs/pm2

# 8. Set production environment
ENV NODE_ENV=production
ENV PORT=4000
ENV MODEL_SERVICE_URL=http://127.0.0.1:8001
ENV MODEL_SERVICE_HOST=127.0.0.1
ENV MODEL_SERVICE_PORT=8001

# Expose only one public port (Express server)
EXPOSE 4000

# Start both Node & Python microservices via PM2 Process Manager
CMD ["pm2-runtime", "start", "infrastructure/ecosystem.config.js"]
