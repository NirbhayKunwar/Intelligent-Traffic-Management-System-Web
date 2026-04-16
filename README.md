# 🚦 Intelligent Traffic Management System (ITMS)

A production-ready, full-stack **Intelligent Traffic Management System** that uses YOLOv8-powered AI to detect traffic congestion and road accidents in real-time, broadcasting instant emergency alerts to verified citizens through an interactive, role-based web dashboard.

---

## 📌 Overview

ITMS bridges the gap between AI-powered computer vision and emergency response. The system continuously monitors traffic camera feeds, detects incidents using deep learning, and automatically dispatches:
- 📧 **Email alerts** to registered citizens
- 🚓 **Multi-agency ETAs** (Police, Ambulance, Fire Dept)
- 📍 **Geo-pinned alerts** on an interactive city map

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🤖 **AI Detection** | YOLOv8-powered accident & congestion detection via a FastAPI microservice |
| 📊 **Live Dashboard** | Role-based dashboards for Operators and Citizens with real-time Recharts |
| 🗺️ **Interactive Map** | Leaflet map with click-to-place camera pinning and smooth, jitter-free navigation |
| 🔐 **Auth System** | JWT + Google OAuth 2.0 with Connect/Disconnect from profile page |
| 📧 **Emergency Alerts** | Automated Gmail dispatch to all verified citizens on accident detection |
| ☁️ **Cloud Media** | Cloudinary integration for profile pictures, incident snapshots, and video samples |
| 🚨 **Active Alerts Panel** | Live incident feed with severity, ETA, and geo-coordinates |
| 📹 **Camera Management** | Deploy, edit, delete CCTV cameras with stream type and status tracking |
| 📁 **Video Analysis** | Support for both live simulation and uploaded video analysis |
| 🌗 **Dark / Light Mode** | System-aware theme with full dark mode support across all views |

---

## 🏗️ System Architecture

```
Traffic Cameras / Cloud Video
          │
          ▼
  ┌──────────────────┐
  │  AI Model Service│  ← Python + FastAPI + YOLOv5/v8
  │  (Port 8001)     │
  └────────┬─────────┘
           │ inference results
           ▼
  ┌──────────────────┐        ┌──────────────────┐
  │  Backend API     │◄──────►│  Database        │
  │  (Port 4000)     │        │  (MongoDB Atlas) │
  │  Node.js + JWT   │        └──────────────────┘
  └────────┬─────────┘
           │ REST API         ┌──────────────────┐
           ▼                  │  Cloud Storage   │
  ┌──────────────────┐◄──────►│  (Cloudinary)    │
  │  React Frontend  │        └──────────────────┘
  │  (Port 5173)     │
  └──────────────────┘
           │ Gmail SMTP
           ▼
     Verified Citizens 📧
```

---

## 🛠️ Tech Stack

### 🎨 Frontend (`itms-frontend/`)
| Technology | Purpose |
|---|---|
| React 18 + Vite | UI framework & build tool |
| React Router v6 | Client-side routing |
| Recharts | Interactive AreaChart & BarChart dashboards |
| React Leaflet | Interactive map with camera location pinning |
| Vanilla CSS | Styling (glassmorphism, dark mode) |
| Cloudinary | Profile picture & video hosting |

### 🔧 Backend (`itms-backend/`)
| Technology | Purpose |
|---|---|
| Node.js + Express | REST API server |
| MongoDB Atlas | Cloud database for users, cameras, and alerts |
| JWT + bcryptjs | Authentication & password hashing |
| Passport.js | Google OAuth 2.0 strategy |
| Nodemailer | Emergency email dispatch via Gmail SMTP |
| Cloudinary SDK | Media management and storage |

### 🤖 AI Model Service (`model-service/`)
| Technology | Purpose |
|---|---|
| Python + FastAPI | AI microservice REST API |
| Ultralytics YOLO | Object detection (vehicles & accidents) |
| OpenCV | Video frame processing |

---

## 📂 Project Structure

```
Capstone/
├── itms-frontend/          # React + Vite frontend
│   ├── src/
│   │   ├── Pages/          # Dashboard, UserDashboard, Profile, Login, Signup
│   │   ├── Components/     # Navbar, Hero, Features, etc.
│   │   └── lib/            # API utility (api.js) 
│
├── itms-backend/           # Node.js + Express API server
│   ├── data/
│   │   ├── .env            # Secrets (gitignored)
│   │   └── .env.example    # Configuration template
│   └── server.js
│
├── model-service/          # Python FastAPI AI microservice
│   ├── app.py
│   ├── requirements.txt
│   └── datasets/           # Local model weights (best.pt / traffic-model.pt)
│
├── .gitignore              # Unified repository ignore rules
└── README.md
```

---

## ⚙️ Installation & Setup

### Prerequisites
- **Node.js** v18+
- **Python** 3.9+
- **MongoDB Atlas** Account
- **Cloudinary** Account
- **Google Cloud** project (OAuth 2.0)
- **Gmail App Passwords** (for automated alerts)

---

### Step-by-Step Installation

1. **Clone & Install Backend**
   ```bash
   cd itms-backend
   npm install
   # Create data/.env based on data/.env.example
   node server.js
   ```

2. **Setup AI Model Service**
   ```bash
   cd model-service
   python -m venv .venv
   source .venv/bin/activate # or .venv\Scripts\activate
   pip install -r requirements.txt
   python app.py
   ```

3. **Install Frontend**
   ```bash
   cd itms-frontend
   npm install
   npm run dev
   ```

---

## 📊 Operations Guide

### Congestion Thresholds
The system has been updated to use **Vehicle Count Thresholds**. 
- **Strict**: 0-10 Vehicles
- **Moderate**: 10-20 Vehicles
- **Lenient**: 20-30+ Vehicles
Operators can adjust these live in the dashboard to tune detection sensitivity per corridor.

### Simulation vs Live
- **Bundled Samples**: Pre-configured videos hosted on Cloudinary for demonstration.
- **Live Deployment**: Users can deploy cameras to official city coordinates and monitor them in the unified "Live Preview" panel.

---

## 📜 License
Developed for academic/capstone purposes. Open for modification and research.
