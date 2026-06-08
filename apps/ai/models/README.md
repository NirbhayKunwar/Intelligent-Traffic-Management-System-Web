# 📂 ITMS Datasets & Sample Media

This directory contains the annotated sample video data used to demonstrate and validate the AI detection capabilities of the **Intelligent Traffic Management System (ITMS)**.

---

## 🏗️ Structure

### 🚗 `Accident model/`
Contains video clips specifically curated to test the **Accident Detection Engine**.
- **Content**: Real-world and simulated traffic accidents, collisions, and vehicle impact scenarios.
- **Model Target**: YOLOv8 trained on accident datasets for high-confidence incident detection.
- **Key Files**: `Cam4.mp4`, etc.

### 🚥 `Congestion model/`
Focuses on vehicle density and traffic flow analysis.
- **Content**: High-traffic corridors, steady flow scenarios, and bottleneck situations.
- **Model Target**: Object detection Optimized for multi-class vehicle identification (Cars, Trucks, Bikes) and density calculation.
- **Key Files**: `TestVideo.mp4`, etc.

---

## 📋 Usage Instructions

1. **Dashboard Import**:
   In the Operator Dashboard, navigate to the **"Import Sample"** section to automatically index and pull videos from these directories into the live monitoring system.

2. **Manual Model Run**:
   You can also select these files via the **"Upload / Select Video"** dropdown in the Congestion or Accident model control panels.

---

## 🔐 Git Note
As defined in the root `.gitignore`, the physical `.mp4` and `.avi` media files in these folders are **excluded from the Git repository** due to their large size. To set up a fresh environment, ensure these folders are populated with relevant test samples.
