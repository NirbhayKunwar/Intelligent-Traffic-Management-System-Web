# ==============================================================================
# STAGE 1: Build Frontend Assets
# ==============================================================================
FROM node:22-slim AS frontend-builder
WORKDIR /usr/src/app

# Copy workspace manifests (no lockfile - avoids platform-specific resolution issues)
# Copy monorepo manifests and lockfile
COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
# Copy source code needed for all packages
COPY packages/shared/ ./packages/shared/
COPY apps/web/ ./apps/web/
COPY apps/api/ ./apps/api/
# Install all dependencies for Linux platform
RUN npm ci --legacy-peer-deps
# Build frontend using workspace command
RUN npm run build --workspace=apps/web -- --debug 2>&1 | tee /tmp/vite-build.log ; cat /tmp/vite-build.log || true

# ==============================================================================
# STAGE 2: Build Backend Dependencies
# ==============================================================================
FROM node:22-slim AS backend-builder
WORKDIR /usr/src/app

COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
# Copy the shared source so workspace can be resolved
COPY packages/shared/ ./packages/shared/

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
COPY monitoring/ ./monitoring/

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
