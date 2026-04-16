# 🎨 ITMS Frontend Client

The user interface for the **Intelligent Traffic Management System**, built with **React** and **Vite** to provide a high-frequency, glassmorphic dashboard experience.

---

## 🚀 Overview
The frontend is designed for both city operators and citizens, offering:
- **Operator Command Center**: Real-time management of CCTV cameras and AI model execution with live progress tracking.
- **Citizen Alert Portal**: Interactive map with live incident feeds and emergency response statuses.
- **Data Visualization**: Dynamic analytics using **Recharts** to plot vehicle counts and accident trends.
- **Micro-Animation Engine**: Premium UI transitions and responsive feedback for high-stress monitoring environments.

---

## 🛠️ Tech Stack
| Component | Technology |
|---|---|
| Library | React 18 |
| Build Tool | Vite |
| Visualization | Recharts (Area/Bar) |
| Maps | Leaflet + React Leaflet |
| Media | Cloudinary (Bundled Samples) |
| Theme | Vanilla CSS (Glassmorphism / Dark Mode) |

---

## 📍 Advanced Mapping
We have implemented a **Zero-Jitter Navigation** system to ensure a smooth operator experience:
- **Intent-Based Movement**: The map only triggers auto-focus when specifically requested (e.g., selecting a new camera).
- **Manual Pinning**: High-precision coordinate picking remains stationary during background data refreshes.
- **Responsive Markers**: Instant visual feedback for incidents, including "Services Alerted" status.

---

## 📂 Key Features

### 🚦 Smart Inference Jobs
- **Real-Time Polling**: The dashboard polls the backend every 2 seconds for high-fidelity progress updates.
- **Vehicle Count Controls**: Direct threshold management using absolute vehicle counts for clear operational boundaries.

### 👤 Premium Profile Hub
- **Cloudinary Integration**: Instant avatar updates and preview.
- **Identity Linking**: Interactive UI for connecting or disconnecting Google Accounts with real-time state persistence.

---

## ⚙️ Setup
1. **Install Dependencies**:
   ```bash
   npm install
   ```
2. **Development Run**:
   ```bash
   npm run dev
   ```
   > The app connects to the API on `http://localhost:4000` by default.
