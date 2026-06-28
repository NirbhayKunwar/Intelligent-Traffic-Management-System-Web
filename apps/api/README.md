# 🛠️ ITMS Backend API Service

The core engine of the **Intelligent Traffic Management System**, providing high-performance REST APIs for user authentication, real-time traffic monitoring, and emergency response management.

---

## 🚀 Overview
Built with **Node.js** and **Express**, this service handles:
- **Identity Proxy**: JWT & Google OAuth 2.0 (Passport.js) session management with link/unlink capabilities.
- **AI Orchestration**: Proxies inference requests to the Python YOLO microservice with real-time progress tracking.
- **Emergency Dispatch**: Automated Parallel SMTP broadcasts via Nodemailer upon accident verification.
- **Media Management**: Intelligent streaming via **Cloudinary** for profile photos, incident snapshots, and video analysis.
- **Persistence**: High-availability cloud storage using **MongoDB Atlas**.

---

## 🛠️ Tech Stack
| Component | Technology |
|---|---|
| Runtime | Node.js (ESM) |
| Framework | Express 5.x |
| Database | MongoDB Atlas (Mongoose) |
| Auth | Passport.js + JWT + bcryptjs |
| Alerts | Nodemailer (Gmail SMTP) |
| Media | Cloudinary SDK + Multer |

---

## ⚙️ Project Configuration
The backend requires a `.env` file located in `apps/api/data/`. See `.env.example` for the full template.

### Core Variables:
- `MONGODB_URI`: Your MongoDB Atlas connection string.
- `CLOUDINARY_URL`: Cloudinary credentials for media hosting.
- `JWT_SECRET`: For secure session signing.
- `MODEL_SERVICE_URL`: URL of the FastAPI AI worker.

---

## 📁 Key Modules

### 🔐 Auth & Profiling
- **Self-Healing Auth**: Detects and merges accounts when users switch between Email and Google login.
- **Profile Hub**: Manage avatars and connected accounts via Cloudinary.

### 🤖 Inference Pipeline
- **Vehicle Count Thresholds**: Transitioned from percentage-based logic to absolute car counts (e.g., alert if count > 15).
- **Progress Sync**: Background workers update the database every 2 seconds to provide smooth UI progress bars.

### 📡 Emergency Protocol
1. AI identifies an accident in `model-service`.
2. Backend triggers the `EmergencyDispatchService`.
3. System fetches **Verified Citizens** (Google-linked) and sends parallel email alerts.
4. Alerts are geo-pinned and stored for historical analytics.

---

## 🛠️ Getting Started

1. **Install**: `npm install`
2. **Environment**: Configure your `.env` in the `data/` directory.
3. **Run**: `node server.js`
