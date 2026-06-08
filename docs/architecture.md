# ITMS System Architecture

This document details the architectural decisions and modular patterns implemented in the Intelligent Traffic Management System (ITMS) refactor.

---

## 🏗️ High-Level Layout

ITMS is structured as an **NPM Workspaces Monorepo**. This coordinates the frontend React app, the Express API backend, and the shared validation library into a single codebase while separating concerns.

```
+-----------------------------------------------------------+
|                       React Browser                       |
+------------------------------------+----------------------+
                                     | (Vite client-side HTTP/HTTPS)
                                     ▼
+-----------------------------------------------------------+
|              Express Gateway Server (Port 4000)           |
|  - apps/api                                               |
|  - Serves compiled React static assets                    |
|  - CORS, Rate limiting, Helmet security headers           |
+-------------------+--------------------+------------------+
                    |                    |
                    | (MongoDB driver)   | (Internal HTTP loopback)
                    ▼                    ▼
+-----------------------+      +----------------------------+
|  MongoDB Atlas Cloud  |      |   FastAPI Model Service    |
|  - Users, Alerts,     |      |   - apps/ai                |
|    CCTV Cameras,      |      |   - Port 8001 (Private)    |
|    Inference Jobs     |      |   - Loads YOLOv8 weights   |
+-----------------------+      +----------------------------+
```

---

## 📦 Feature-Based Modules (Backend)

The backend (`apps/api`) has been refactored from a single monolithic file into a **Feature-Based Modular Architecture**. Each feature module in `apps/api/modules/` encapsulates its own:
* **Routes**: Defines Express REST endpoint pathways.
* **Controllers**: Processes incoming HTTP request data and formats JSON outputs.
* **Models**: Defines Mongoose Schemas.
* **Services**: Encapsulates specific domain operations (e.g. JWT signing, password resets).

### Modules Listing:
1. `auth`: Manages sessions, registration, and federated Google OAuth logins.
2. `camera`: Coordinates CCTV camera entries, types, status tracking, and simulation feeds.
3. `alert`: Fetches live alerts and reports coordinates.
4. `inference`: Runs background prediction workers, schedules tasks, and parses vehicle details.
5. `settings`: Configures dynamic detection settings and threshold values.
6. `upload`: Handles Cloudinary API interactions, saves metadata.
7. `metrics`: Aggregate statistics, congestion indexes, hourly trends.

---

## 🤖 AI Inference Flow

To keep the FastAPI microservice private and secure:
1. The Express server acts as a proxy/gateway.
2. When an inference job is created, the backend calls `aiService.js` which performs an internal loopback request to `http://127.0.0.1:8001/infer/congestion` or `/infer/accident`.
3. If the model service detects a congestion status above thresholds, or an accident, the backend registers the alert and triggers Nodemailer email alerts.
