# 🚦 Intelligent Traffic Management System (ITMS)

A web-based **Intelligent Traffic Management System (ITMS)** that detects traffic congestion and road accidents using annotated datasets and visualizes insights through an interactive dashboard.

---

## 📌 Overview

ITMS is designed to improve traffic monitoring by combining **computer vision**, **data analysis**, and **modern web technologies**.
It provides a centralized platform for detecting traffic conditions and incidents, helping authorities respond faster and more efficiently.

---

## ✨ Features

* 🚗 Vehicle detection & congestion estimation
* ⚠️ Accident detection using annotated datasets
* 📊 Real-time dashboard visualization
* 🔐 Authentication (JWT + Google OAuth)
* 🗺️ Map-based traffic insights (Leaflet)
* ⚡ Fast and responsive UI

---

## 🏗️ System Architecture

```
Traffic Data → Detection Module → Backend API → Frontend Dashboard
```

### Components:

* **Data Source**: Traffic datasets / CCTV frames
* **Detection Module**: Vehicle & accident detection
* **Backend**: APIs, authentication, storage
* **Frontend**: Visualization dashboard

---

## 🧠 Methodology

1. Preprocess traffic datasets
2. Apply object detection models
3. Estimate vehicle density (congestion)
4. Detect accidents using labeled data
5. Send results to backend
6. Display insights on dashboard

---

## 📂 Datasets

### 🚗 Congestion Dataset

* 626 annotated images and more
* YOLO format
* Resolution: 640×640

### ⚠️ Accident Dataset

* 1,258 annotated images and more
* Train/Val/Test split
* Resolution: 640×640

---

## 🛠️ Tech Stack

### 🔧 Backend

* Node.js
* Express.js
* MongoDB (Mongoose)
* JWT Authentication
* Passport.js (Google OAuth)
* LowDB

### 🎨 Frontend

* React (Vite)
* Tailwind CSS
* React Router
* Leaflet & React Leaflet
* Framer Motion
* Lucide Icons

---

## 📁 Project Structure

```
itms/
├── itms-backend/     # API, authentication, database
├── itms-frontend/    # React UI and dashboard
```

---

## ⚙️ Installation & Setup

### 1️⃣ Clone the repository

```bash
git clone https://github.com/your-username/itms.git
cd itms
```

---

### 2️⃣ Setup Backend

```bash
cd itms-backend
npm install
```

Create a `.env` file:

```env
PORT=4000
JWT_SECRET=your_secret_key
CLIENT_ORIGIN=http://localhost:5173
GOOGLE_CLIENT_ID=your_google_client_id
```

Run backend:

```bash
node server.js
```

---

### 3️⃣ Setup Frontend

```bash
cd itms-frontend
npm install
npm run dev
```

---

## 📊 Evaluation Metrics

* Precision, Recall, F1-score (Accident Detection)
* Mean Absolute Error (Congestion Estimation)
* Latency (Detection → Dashboard)

---

## 🚀 Future Enhancements

* Live CCTV stream integration
* AI-based congestion prediction
* Smart traffic signal control
* Cloud deployment (AWS/GCP)
* Multi-modal traffic analysis

---

## 👨‍💻 Team

* Nirbhay Singh Kunwar
* Rohit Kumar
* Alok Raj

---

## 📜 License

This project is for academic purposes. You can modify and extend it for learning and research.

---

## ⭐ Support

If you like this project, give it a ⭐ on GitHub!
