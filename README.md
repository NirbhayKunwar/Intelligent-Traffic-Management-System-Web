# 🚦 Intelligent Traffic Management System (ITMS) - Monorepo

Welcome to the production-ready, monorepo refactored **Intelligent Traffic Management System**. This repository organizes the system into apps and shared packages, making it deployable as a single unit.

---

## 📌 Architecture Overview

```
                   Client / Browser
                          │
                          ▼
            ┌───────────────────────────┐
            │   Express Server (Port)   │ (apps/api)
            ├───────────────────────────┤
            │  • Serves React SPA static│
            │  • Handles REST API calls │
            │  • Proxies AI calls       │
            └─────────────┬─────────────┘
                          │
                 ┌────────┴────────┐
                 ▼                 ▼
        ┌─────────────────┐ ┌──────────────┐
        │  Local FastAPI  │ │   MongoDB    │
        │   (Port 8001)   │ │   (Atlas)    │
        │    (apps/ai)    │ └──────────────┘
        └─────────────────┘
```

---

## 📂 Repository Structure

* `apps/web`: React SPA frontend built using Vite and Tailwind CSS.
* `apps/api`: Express backend, now serving the built frontend statically and proxying detection queries.
* `apps/ai`: Python FastAPI AI detection service powered by YOLOv8.
* `packages/shared`: Shared types, constants, and validation schemas.
* `infrastructure`: Production configuration files (`Dockerfile`, `ecosystem.config.js`).
* `scripts`: Orchestration scripts (`build.js`, `start.js`, `verify.js`).

---

## 🚀 Quick Start (Development)

1. **Install Root & Project Dependencies**
   ```bash
   npm run bootstrap
   ```

2. **Setup Environment Variables**
   Configure your secrets in `apps/api/data/.env` (using `.env.example` as a template).

3. **Run Services Concurrently**
   ```bash
   npm start
   ```

---

## 🐳 Production Deployment

To run the unified production build via Docker:

```bash
docker build -t itms-app -f infrastructure/Dockerfile .
docker run -p 4000:4000 --env-file apps/api/data/.env itms-app
```
This launches a single optimized container running Node and FastAPI managed by PM2, exposing only port 4000.
