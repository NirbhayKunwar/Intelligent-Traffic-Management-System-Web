# 🤖 ITMS AI Model Credits & Attribution

The **Intelligent Traffic Management System (ITMS)** utilizes advanced computer vision architectures and custom-trained object detection models to evaluate traffic congestion and identify road accidents in real time. We are deeply grateful to the open-source community, researchers, and developers whose hard work made these models possible.

Below is the detailed attribution for all artificial intelligence and computer vision models integrated into the ITMS platform.

---

## 🏎️ 1. Ultralytics YOLOv8 (Model Backbone)
- **Author/Creator**: [Ultralytics](https://github.com/ultralytics)
- **Repository**: [https://github.com/ultralytics/ultralytics](https://github.com/ultralytics/ultralytics)
- **License**: AGPL-3.0 License / Commercial
- **Role in ITMS**: YOLOv8 (specifically the nano variant `yolov8n.pt`) is used as the base detector for multi-class vehicle identification (Cars, Buses, Trucks, Motorcycles, Bicycles) and provides the bounding box coordinates required by our tracking algorithms.

---

## 🚨 2. Accident Detection Model (`best.pt`)
- **Backbone Architecture**: Ultralytics YOLOv8 (Custom-trained)
- **Role in ITMS**: Evaluates video frames to classify and localize vehicle collisions, crashes, and road hazards.
- **Dataset / Training Attribution**: 
  - Trained on public traffic accident datasets (including CADP - Car Crash Dataset and custom web-scraped traffic surveillance crash videos).
  - Employs spatial object detection combined with temporal overlap analysis.
  - Credit is given to the researchers and curators of these accident footage archives for labeling and publishing collision datasets for academic and safety research.

---

## 📊 3. Traffic Congestion & Volume Model (`traffic-model.pt`)
- **Backbone Architecture**: Ultralytics YOLOv8 (Optimized)
- **Source Project**: Sourced from traffic surveillance monitoring research repositories.
- **Role in ITMS**: Identifies vehicle categories and provides accurate density inputs. Coupled with our tracker, it measures instant speed reductions andstopped ratios to calibrate the congestion severity index.
- **Attribution**:
  - We acknowledge the creators of the `Traffic-Monitor` dataset and custom weights developers for compiling, annotated, and training YOLO models to recognize vehicles from overhead street CCTV perspectives.

---

## 📓 4. Kaggle Notebook Reference
- **Author/Creator**: **Sara Zahran** (Kaggle Notebooks Master)
- **Profile**: [Sara Zahran on Kaggle](https://www.kaggle.com/sarazahran)
- **Notebook Link**: [Real-time Accident Detection and Traffic Analysis on Kaggle](https://www.kaggle.com/code/sarazahran1/real-time-accident-detection-and-traffic-analysis)
- **Contribution**: Author of the original Kaggle notebook `real-time-accident-detection-and-traffic-analysis.ipynb` located in the root of this repository. This notebook established the vehicle coordinate checking loop, the OpenCV frame extraction stride, and visual validation charts that formed the basis of our FastAPI detection microservice.

---

## 📂 5. CCTV Incident Dataset
- **Author/Curator**: **Surya Prabhakaran**
- **Profile**: [Surya Prabhakaran on Kaggle](https://www.kaggle.com/suryaprabhakaran)
- **Dataset**: [Road Accidents from CCTV Footages Dataset](https://www.kaggle.com/datasets/suryaprabhakaran/road-accidents-from-cctv-footages-dataset)
- **Contribution**: Compiled and published the extensive dataset of over 27,000 traffic footage frames and surveillance videos used to test, tune, and demonstrate the accident detection and density classification parameters of this platform.

---

## 🛠️ 6. Supporting Computer Vision Libraries

### 👁️ OpenCV (Open Source Computer Vision Library)
- **Creators**: Intel, Willow Garage, and the OpenCV community
- **Repository**: [https://github.com/opencv/opencv](https://github.com/opencv/opencv)
- **License**: Apache 2 License
- **Role in ITMS**: Performs all low-level video capturing, frame decoding, color space transformations, and geometric computations for velocity vectors.

### 🐍 NumPy (Numerical Python)
- **Repository**: [https://github.com/numpy/numpy](https://github.com/numpy/numpy)
- **License**: BSD 3-Clause License
- **Role in ITMS**: Used for high-speed multi-dimensional array operations, distance calculation between frame detections, and computing statistical averages for vehicle counts and speeds.

---

## ⚖️ 7. License & Ethical Use
Both the custom accident and traffic density models are intended for civil traffic planning and emergency response optimization. Users must adhere to local privacy and surveillance regulations when deploying these models on live public corridor streams.
