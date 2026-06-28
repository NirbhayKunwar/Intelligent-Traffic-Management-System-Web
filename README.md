# 🚦 Intelligent Traffic Management System (ITMS) - Platform Architecture Manual

The **Intelligent Traffic Management System (ITMS)** is a production-grade, monorepo-architected Smart City Operations Platform. It integrates high-performance computer vision pipelines, real-time vehicle telemetry, dynamic OSRM routing matrices, and automated emergency notification relays into a unified SaaS-level command center interface.

The platform is designed to look and perform at the level of industry operations consoles (comparable to the Tesla Fleet Console, Uber Operations Command, and Vercel/Stripe dashboards).

---

## 📌 Architecture Topology

The application operates as a multi-tier microservice cluster packaged in a single production container managed by the PM2 process runtime.

```text
                                  ┌────────────────────────┐
                                  │    Client / Browser    │
                                  │ (React 19 + Tailwind4) │
                                  └───────────┬────────────┘
                                              │
                                              │ REST / WebSockets / Static Assets
                                              ▼
                             ┌─────────────────────────────────┐
                             │       Express API Gateway       │ (Port 4000 / apps/api)
                             ├─────────────────────────────────┤
                             │ • Hosts React SPA build static  │
                             │ • Manages JWT Auth & OAuth2     │
                             │ • Schedules inference job logs  │
                             └──────────────┬──────────────────┘
                                            │
                             ┌──────────────┴──────────────┐
                             │                             │
                             ▼                             ▼
             ┌──────────────────────────────┐     ┌──────────────────┐
             │    FastAPI Model Service     │     │  MongoDB Atlas   │
             │     (Python / Port 8001)     │     │ (Mongoose Schema)│
             ├──────────────────────────────┤     └──────────────────┘
             │ • YOLOv8 Vehicle Tracker     │
             │ • Visual Accident Classifier │
             └──────────────────────────────┘
```

---

## 📂 Project Directory Structure

```txt
Capstone/
 ├── apps/
 │    ├── web/                   # React 19 Client SPA (Vite + Tailwind v4)
 │    │    ├── src/
 │    │    │    ├── design-system/   # 60-30-10 Golden Palette variables
 │    │    │    ├── animations/      # Centralized Framer Motion vault
 │    │    │    ├── Pages/           # Operator & Citizen Portal pages
 │    │    │    └── Components/      # Common UI (Skeletons, Status Badges)
 │    ├── api/                   # Express 5.x Backend API service
 │    │    ├── config/           # Database & Cloudinary configurations
 │    │    ├── middleware/       # JWT Auth and Helmet Security CSP rules
 │    │    ├── modules/          # Auth, Camera nodes, Alerts, Uploads
 │    │    └── services/         # Nodemailer SMTP and AI service proxy
 │    └── ai/                    # FastAPI Python AI inference microservice
 │         ├── models/           # YOLOv8 .pt custom weights
 │         └── app.py            # Computer Vision tracking & collision logic
 ├── packages/
 │    └── shared/                # Common types, validation schemas, and constants
 ├── infrastructure/             # Docker multi-stage build & PM2 config
 └── scripts/                    # Bootstrap, start, and verification scripts
```

---

## 🎨 Design System & Visual Hierarchy

The frontend is styled strictly around the **60-30-10 golden design rule** to establish a high-end SaaS theme:
- **60% Dominant Canvas (Background)**: `#f8fafc` (slate-50) for light mode and `#020617` (slate-950) for dark mode.
- **30% Secondary Structure (Surfaces & text)**: Cards, borders, inputs (`bg-white` / `bg-slate-900/60`), and slate text classes (`text-slate-900` / `text-slate-100`).
- **10% Accent (Call-To-Actions)**: Interactive highlights, focus states, and button gradients utilizing cyan-to-indigo overlays (`from-cyan-500 to-indigo-500`).

Grid structures are governed by responsive 12-column layouts fluidly scaling from **Mobile (320px)**, **Tablet (768px)**, **Laptop (1024px)**, **Desktop (1440px)**, up to **Ultra-wide (1920px+)** screens.

---

## ⚙️ Environment Configuration

Create a `.env` file in `apps/api/data/.env` (based on the `.env.example` template).

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB Atlas cluster connection string |
| `JWT_SECRET` | Secret token used to sign session cookies |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary storage bucket account name |
| `CLOUDINARY_API_KEY` | Cloudinary storage credentials key |
| `CLOUDINARY_API_SECRET` | Cloudinary storage secret |
| `MODEL_SERVICE_URL` | AI service connection URL (default `http://127.0.0.1:8001`) |
| `MODEL_SERVICE_STRICT` | If `true`, fails Express endpoints if AI worker is offline |

---

## 🚀 Getting Started (Local Development)

### 1. Bootstrap Monorepo
Install root package dependencies and link shared monorepo modules:
```bash
npm run bootstrap
```

### 2. Verify File Layout
Run system path and environment parameter checks:
```bash
npm run verify
```

### 3. Start Services
Launch frontend, API backend, and Python FastAPI server concurrently in development mode:
```bash
npm start
```
- Client portal is served on `http://localhost:5173`.
- API Server is served on `http://localhost:4000`.
- AI Model Service is served on `http://localhost:8001`.

---

## 🤖 AI Inference Pipelines

The system is equipped with custom model checkpoints stored in `apps/ai/models/`:

### 🚨 Accident Classification & Collision Physics
- **Weights**: `Accident model/best.pt` (YOLOv8 custom-trained).
- **Process**: Identifies collision boxes in surveillance frames. Concurrently, our tracker maps vehicle centroids to evaluate physical trajectories. If centroids collide and rapid speed reductions occur, an emergency state is verified.
- **Protocol**: Positive detections automatically query the database for Google-linked "Verified Citizens" in that coordinate radius and dispatch Nodemailer parallel email alerts.

### 🚥 Congestion density Profiling
- **Weights**: `Congestion model/traffic-model.pt` (YOLOv8 custom-trained).
- **Process**: Performs vehicle type counts. Evaluates instant velocities and computes the stopped vehicle ratio. A weighted index blending density and flow rate determines the alert index (Critical, Moderate, Low, Clear).
- **Protocol**: Triggers automatic signal scheduling updates and adjusts routes dynamically on citizen dashboards.

Detailed attribution to model developers and datasets is maintained in [MODEL_CREDITS.md](MODEL_CREDITS.md).

---

## 🐳 Production Deployment

To package the entire monorepo into a single self-contained production unit, run the multi-stage Docker build:

```bash
# Build the unified image
docker build -t itms-platform -f infrastructure/Dockerfile .

# Run container (port 4000 hosts both static React files and API routing)
docker run -d -p 4000:4000 --env-file apps/api/data/.env --name itms-container itms-platform
```

The runtime image is built on top of `python:3.10-slim-bookworm`, overlaying Node.js 22, OpenCV libraries, and PM2 process management to run both Express and FastAPI processes securely with auto-restart and log-merging.

---

## 👥 Project Team & Contributors

* **Nirbhay Singh Kunwar** (Frontend Lead & Backend Developer)
  * Designed and built the React 19 frontend using TailwindCSS v4.
  * Implemented Leaflet map controls, zero-jitter navigation, and incident pinning.
  * Integrated Cloudinary media pipelines for profile pictures and incident uploads.
  * Assisted in writing Express controllers for authentication and account linking.

* **Rohit Kumar** (Backend Developer & Model Research)
  * Developed Node.js/Express API server routes, database schemas, and JWT authentication.
  * Integrated the python-to-express API proxies and progress tracking logic.
  * Configured YOLOv8 object tracking models and collision-detection loops.
  * Built telemetry charting components using Recharts.

* **Alok Raj** (Backend Lead & Research)
  * Developed the email alert dispatcher (Nodemailer) to notify nearby citizens of accidents.
  * Implemented express session management, authentication middleware, and security configurations.
  * Managed custom model training workflows and wrote frame extraction scripts.
  * Set up PM2 configurations, server logs, and Docker containerization.

---

### 📊 Project Case Studies & Research
Additionally, all team members conducted case studies on system performance and model tracking accuracy.

### 📓 Open Source Research
Our development process and core collision-detection mathematics are documented in the open-sourced research notebook:
* [real-time-accident-detection-and-traffic-analysis.ipynb](file:///c:/Users/nirbh/Desktop/Capstone/real-time-accident-detection-and-traffic-analysis.ipynb) ([Kaggle Source](https://www.kaggle.com/code/sarazahran1/real-time-accident-detection-and-traffic-analysis)) — Contains the original data training runs, coordinate checking loops, frame extraction strides, and visual validation plots.
