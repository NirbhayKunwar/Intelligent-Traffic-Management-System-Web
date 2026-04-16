# Intelligent Traffic Monitoring System (ITMS)

Welcome to the **Intelligent Traffic Monitoring System**, an advanced computer vision pipeline powered by PyTorch and a custom-trained YOLO model. This system dynamically monitors road traffic, tracks vehicle persistence, computes average speeds, and algorithmically dictates real-time congestion statuses using interactive camera zones.

---

## 🚦 Features
- **Custom Trained AI Model:** Deploys a specialized YOLO neural network highly trained to target granular vehicle classes (cars, buses, ambulances, motorbikes, human-haulers, etc.).
- **Interactive Region of Interest (ROI):** Click and draw a custom polygonal perimeter around specific lanes at the start of any video to filter out oncoming traffic or sidewalks.
- **Smart Tracking Architecture:** Features a custom frame-by-frame Intersection-over-Union (IoU) tracker to persist vehicle IDs and accurately calculate pixel-to-pixel speed variations.
- **Two-Tiered Congestion Math:** Calculates congestion dynamically via Hard vehicle counts and Soft rules that trigger based on dropping average velocities. 
- **Automated Directory Processing:** Automatically crawls the project directory to sequentially process all un-analyzed `.mp4` CCTV camera files.
- **Dynamic On-Screen HUD:** Vibrant color-coded telemetry overlays scaled cleanly to your monitor logic without altering original resolution rendering.

---

## 📊 The Deep Learning Dataset
The `traffic-model.pt` neural network powering the analytics is based on the robust Roboflow **Vehicle Detection YOLOv8** dataset. 
It has been expertly trained on diverse urban traffic sets and deployed here using a compatible tracking framework.
* **Dataset Link:** [Universe Roboflow Vehicle Detection](https://universe.roboflow.com/farzad/vehicle_detection_yolov8)

---

## 🛠️ Required Dependencies
Before running the system, ensure you have Python 3.9+ installed natively. The project leverages several critical packages, each curated for a specific backend processing requirement:

1. **`opencv-python` (`cv2`)**
   * **Why it's used:** Functions as the backbone pipeline for frame extraction (`cv2.VideoCapture`), drawing bounding boxes, displaying the GUI popup windows (`cv2.imshow`), rendering text HUDs, and managing the mouse-click listeners for ROI polygons.
2. **`torch` & `torchvision` (PyTorch)**
   * **Why it's used:** Powers the tensor operations that perform the actual AI inference. `torch.hub` is explicitly utilized to seamlessly fetch the correct model architecture structure dynamically without causing library-version collisions with newer YOLO repositories.
3. **`numpy`**
   * **Why it's used:** Acts as the high-speed math utility for manipulating matrices. Specifically used here for constructing the complex polygon tracking arrays (`np.array`) and accelerating average pixel-speed computations (`np.mean`).

**Installation Command:**
```bash
pip install opencv-python numpy torch torchvision
```
*(Note: Processing large camera models relies heavily on CPU/GPU power. Ensure PyTorch is compiled for CUDA if running on NVIDIA hardware).*

---

## 🚀 How to Run the Project

### 1. Organize your Media 
Simply drag and drop your `.mp4` traffic camera videos into the root folder of this project (e.g., `Cam1.mp4`, `Cam2.mp4`...).

### 2. Configure Your Run Pattern
Open `traffic-monitor.py` and scroll to the very bottom to choose how you want to deploy the script:
* **Option 1 (Single File Testing):** Uncomment the exact lines to hardcode a test string like `"sample_video1.mp4"`. This lets you safely tweak math and thresholds on a loop.
* **Option 2 (Directory Automation):** Leave the defaults alone, and the Python `glob` module will automatically crawl the folder and process every video sequentially. 

### 3. Launch the Monitor
Open your terminal inside the project directory and run:
```bash
python traffic-monitor.py
```

### 4. Setting the Lane ROI (Region of Interest)
As soon as a new video begins, a window titled **"Select Lane ROI"** will pop up on frame 1. 
* **Draw:** Left-click repeatedly over the top of the video to place yellow markers bordering the lane you want to actively monitor. 
* **ENTER:** Press the `ENTER` key to lock in the geometry and begin the AI tracking.
* **C:** Press `C` to clear points if you mess up.
* **Q:** Press `Q` to completely skip the custom shape and monitor the *entire* screen globally.

### 5. Controlling the Live Feed
While the traffic monitor is actively analyzing a video, you can control the playback using your keyboard:
* **`Q` (Quit Current):** Instantly skips the current video and begins processing the next camera feed in your directory.
* **`ESC` (Kill Switch):** Immediately shuts down the entire application, closing all windows, regardless of how many videos are left in the queue.

---

## ⚙️ Adjusting the Congestion Physics
All traffic jam mathematics can be edited inside `traffic-monitor.py` under the **CONFIG** header (Lines 17-22). 

* `CONG_COUNT_HARD = 20`: If this sheer volume of vehicles enters your polygon, the HUD will instantly report **CONGESTION DETECTED**, bypassing all other checks. 
* `CONG_COUNT_SOFT = 12`: If vehicle density reaches *this* lower threshold, the system triggers congestion **ONLY** if the collective average speed of the vehicles drops below the `CONG_SPEED_THRESH`. 
* `CONG_SPEED_THRESH = 3.5`: Pixel distance shifted per frame. Adjust this depending on your camera angle! If vehicles fall below this velocity threshold during a soft count, the system assumes they are trapped in a jam.
