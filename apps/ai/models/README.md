# 📂 ITMS Datasets & Sample Media

This directory contains the annotated sample video data used to demonstrate and validate the AI detection capabilities of the **Intelligent Traffic Management System (ITMS)**.

---

## 🏗️ Structure

### 🚗 `Accident model/`
Contains the trained custom model weights for accident detection.
- **Weights File**: [best.pt](file:///c:/Users/nirbh/Desktop/Capstone/apps/ai/models/Accident%20model/best.pt)
- **Model Target**: YOLOv8 custom-trained on accident datasets to classify and localize vehicle collisions and road hazards.

### 🚥 `Congestion model/`
Contains the model weights for vehicle profiling and density calculation.
- **Weights File**: [traffic-model.pt](file:///c:/Users/nirbh/Desktop/Capstone/apps/ai/models/Congestion%20model/traffic-model.pt)
- **Model Target**: YOLOv8 optimized for multi-class vehicle identification (Cars, Buses, Trucks, Motorcycles, Bicycles) and calculating stopped vehicle ratios.

---

## 📋 Usage Instructions

1. **Model Loading**:
   These custom model checkpoints are dynamically loaded by the FastAPI microservice upon starting the server.

2. **Manual Overrides**:
   You can override the model paths by setting the `ACCIDENT_MODEL_PATH` and `CONGESTION_MODEL_PATH` environment variables.

---

## 🔐 Git Note
As defined in the root `.gitignore`, any raw video datasets or sample video files (`.mp4`, `.avi`, etc.) placed inside these folders are **excluded from the Git repository** due to their large size. Only the model weight files (`.pt`) are tracked under this directory.
