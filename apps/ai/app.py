import os
from typing import Literal, Optional
from collections import deque

import cv2
import numpy as np
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from ultralytics import YOLO


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ACCIDENT_MODEL_PATH = os.getenv(
    "ACCIDENT_MODEL_PATH",
    os.path.abspath(os.path.join(BASE_DIR, "models", "Accident model", "best.pt")),
)
CONGESTION_MODEL_PATH = os.getenv(
    "CONGESTION_MODEL_PATH", 
    os.path.abspath(os.path.join(BASE_DIR, "models", "Congestion model", "traffic-model.pt"))
)

app = FastAPI(title="ITMS Model Service", version="1.0.0")

_accident_model = None
_congestion_model = None


class InferRequest(BaseModel):
    source_type: Literal["camera", "upload"] = "camera"
    source: str = Field(..., min_length=1)
    threshold: int = Field(65, ge=0, le=100)
    conf: float = Field(0.25, ge=0.0, le=1.0)
    frame_stride: int = Field(8, ge=1, le=120)
    max_frames: int = Field(150, ge=30, le=3000)


def _load_accident_model() -> YOLO:
    global _accident_model
    if _accident_model is None:
        if not os.path.exists(ACCIDENT_MODEL_PATH):
            raise HTTPException(status_code=500, detail=f"Accident model not found: {ACCIDENT_MODEL_PATH}")
        _accident_model = YOLO(ACCIDENT_MODEL_PATH)
    return _accident_model


def _load_congestion_model() -> YOLO:
    global _congestion_model
    if _congestion_model is None:
        # If it's the default yolov8n.pt, we don't need to check path exists as YOLO() downloads it
        if CONGESTION_MODEL_PATH != "yolov8n.pt" and not os.path.exists(CONGESTION_MODEL_PATH):
            raise HTTPException(
                status_code=500, detail=f"Congestion model not found: {CONGESTION_MODEL_PATH}"
            )
        try:
            _congestion_model = YOLO(CONGESTION_MODEL_PATH)
        except Exception as e:
            # If the custom model fails, fallback to standard yolov8n
            print(f"FAILED TO LOAD CUSTOM MODEL {CONGESTION_MODEL_PATH}: {e}. Falling back to yolov8n.pt")
            _congestion_model = YOLO("yolov8n.pt")
    return _congestion_model


def _open_capture(source: str) -> cv2.VideoCapture:
    # Normalize paths for Windows to avoid backslash issues
    clean_source = os.path.normpath(source) if os.path.isabs(source) else source
    cap = cv2.VideoCapture(clean_source)
    if not cap.isOpened():
        raise HTTPException(status_code=400, detail=f"Cannot open source: {clean_source}")
    return cap


def _class_label(model: YOLO, cls_id: int) -> str:
    names = model.names
    if isinstance(names, dict):
        return str(names.get(cls_id, cls_id))
    if isinstance(names, (list, tuple)) and 0 <= cls_id < len(names):
        return str(names[cls_id])
    return str(cls_id)


def _nearest_speeds(prev_centers, curr_centers, max_dist=80.0):
    if not prev_centers or not curr_centers:
        return []
    speeds = []
    used = set()
    for cx, cy in curr_centers:
        best_idx = -1
        best_dist = float("inf")
        for idx, (px, py) in enumerate(prev_centers):
            if idx in used:
                continue
            d = float(np.hypot(cx - px, cy - py))
            if d < best_dist:
                best_dist = d
                best_idx = idx
        if best_idx >= 0 and best_dist <= max_dist:
            speeds.append(best_dist)
            used.add(best_idx)
    return speeds


def _is_vehicle_label(label: str) -> bool:
    value = label.lower()
    keywords = ["car", "bus", "truck", "motor", "bicycle", "van", "cycle", "auto", "vehicle", "scooter"]
    return any(k in value for k in keywords)


class AdvancedVehicleTracker:
    """Advanced vehicle tracking with accident detection features."""
    
    def __init__(
        self,
        speed_change_threshold: float = 0.7,
        direction_change_threshold: float = 45.0,
        collision_distance: float = 50.0,
        tracking_history: int = 30
    ):
        self.vehicles = {}
        self.track_history = {}
        self.accident_candidates = {}
        self.frame_count = 0
        self.speed_change_threshold = speed_change_threshold
        self.direction_change_threshold = direction_change_threshold
        self.collision_distance = collision_distance
        self.tracking_history = tracking_history
        
    def update_tracks(self, detections):
        """Update vehicle tracks and extract features for accident detection."""
        current_vehicles = {}
        accident_flags = []
        assigned_ids = set()
        
        for det in detections:
            vehicle_id = self._assign_vehicle_id(det, assigned_ids)
            assigned_ids.add(vehicle_id)
            
            if vehicle_id not in self.track_history:
                self.track_history[vehicle_id] = deque(maxlen=self.tracking_history)
            
            current_data = {
                'bbox': det['bbox'],
                'center': det['center'],
                'frame': self.frame_count,
                'speed': self._calculate_speed(vehicle_id, det['center']),
                'area': self._calculate_area(det['bbox']),
                'type': det['type']
            }
            
            self.track_history[vehicle_id].append(current_data)
            current_vehicles[vehicle_id] = current_data
            
            accident_probability = self._assess_accident_risk(vehicle_id)
            if accident_probability > 0.7:
                accident_flags.append((vehicle_id, accident_probability))
        
        self.frame_count += 1
        return current_vehicles, accident_flags
    
    def _assign_vehicle_id(self, detection, assigned_ids):
        """Assign unique ID to vehicle based on position and features."""
        center_x, center_y = detection['center']
        area = self._calculate_area(detection['bbox'])
        
        potential_id = f"{detection['type']}_{int(center_x//50)}_{int(center_y//50)}_{int(area//100)}"
        
        best_id = None
        best_dist = 100.0  # Max distance matching threshold
        
        for vid, history in self.track_history.items():
            if vid in assigned_ids:
                continue
            if len(history) > 0:
                last_pos = history[-1]['center']
                distance = np.sqrt((center_x - last_pos[0])**2 + (center_y - last_pos[1])**2)
                if distance < best_dist:  
                    best_dist = distance
                    best_id = vid
                    
        if best_id is not None:
            return best_id
        
        # Ensure new ID is unique
        suffix = 0
        unique_id = potential_id
        while unique_id in self.track_history or unique_id in assigned_ids:
            suffix += 1
            unique_id = f"{potential_id}_{suffix}"
            
        return unique_id
    
    def _calculate_speed(self, vehicle_id, current_center):
        """Calculate vehicle speed based on movement history."""
        if vehicle_id not in self.track_history or len(self.track_history[vehicle_id]) < 1:
            return 0.0
        
        history = list(self.track_history[vehicle_id])
        prev_center = history[-1]['center']
        
        distance = float(np.sqrt((current_center[0] - prev_center[0])**2 + 
                                (current_center[1] - prev_center[1])**2))
        return distance
    
    def _calculate_area(self, bbox):
        """Calculate bounding box area."""
        x1, y1, x2, y2 = bbox
        return float((x2 - x1) * (y2 - y1))
    
    def _assess_accident_risk(self, vehicle_id):
        """Assess accident risk based on multiple factors."""
        if vehicle_id not in self.track_history or len(self.track_history[vehicle_id]) < 5:
            return 0.0
        
        history = list(self.track_history[vehicle_id])
        risk_score = 0.0
        
        # Factor 1: Sudden speed reduction
        speeds = [entry['speed'] for entry in history]
        if len(speeds) >= 3:
            recent_speed = float(np.mean(speeds[-3:]))
            older_speed = float(np.mean(speeds[:-3]))
            if older_speed > 0 and recent_speed / older_speed < self.speed_change_threshold:
                risk_score += 0.4
        
        # Factor 2: Erratic movement
        if len(history) >= 3:
            directions = []
            for i in range(1, len(history)):
                dx = history[i]['center'][0] - history[i-1]['center'][0]
                dy = history[i]['center'][1] - history[i-1]['center'][1]
                if dx != 0:
                    angle = float(np.degrees(np.arctan2(dy, dx)))
                    directions.append(angle)
            
            if len(directions) >= 2:
                direction_changes = np.abs(np.diff(directions))
                direction_changes = np.minimum(direction_changes, 360 - direction_changes)
                large_changes = int(np.sum(direction_changes > self.direction_change_threshold))
                if large_changes / len(direction_changes) > 0.3:
                    risk_score += 0.3
        
        # Factor 3: Proximity to other vehicles (potential collision)
        current_vehicle = history[-1]
        for other_id, other_history in self.track_history.items():
            if other_id != vehicle_id and len(other_history) > 0:
                other_current = other_history[-1]
                distance = float(np.sqrt((current_vehicle['center'][0] - other_current['center'][0])**2 +
                                         (current_vehicle['center'][1] - other_current['center'][1])**2))
                if distance < self.collision_distance:
                    risk_score += 0.3
                    break
        
        return min(risk_score, 1.0)


@app.get("/health")
def health():
    return {
        "status": "ok",
        "accidentModelPath": ACCIDENT_MODEL_PATH,
        "congestionModelPath": CONGESTION_MODEL_PATH,
    }


@app.post("/infer/accident")
def infer_accident(req: InferRequest):
    try:
        accident_model = _load_accident_model()
        vehicle_model = _load_congestion_model()
        tracker = AdvancedVehicleTracker()
        cap = _open_capture(req.source)

        processed = 0
        positive_frames = 0
        max_conf = 0.0
        frame_idx = 0

        try:
            while cap.isOpened() and processed < req.max_frames:
                ok, frame = cap.read()
                if not ok:
                    break
                frame_idx += 1
                if frame_idx % req.frame_stride != 0:
                    continue

                # Run custom accident model
                accident_result = accident_model(frame, conf=req.conf, verbose=False)[0]
                
                # Run vehicle detection model (yolov8n)
                vehicle_result = vehicle_model(frame, conf=req.conf, verbose=False)[0]
                
                # Extract vehicle detections for tracking
                detections = []
                for box in vehicle_result.boxes:
                    cls_id = int(box.cls[0])
                    confidence = float(box.conf[0])
                    label = _class_label(vehicle_model, cls_id)
                    if _is_vehicle_label(label):
                        x1, y1, x2, y2 = box.xyxy[0].tolist()
                        center_x = (x1 + x2) / 2.0
                        center_y = (y1 + y2) / 2.0
                        detections.append({
                            'bbox': [int(x1), int(y1), int(x2), int(y2)],
                            'center': (center_x, center_y),
                            'type': label,
                            'confidence': confidence
                        })
                
                # Update tracks & assess physics risk
                current_vehicles, accident_flags = tracker.update_tracks(detections)
                
                frame_positive = False
                tracker_max_conf = 0.0
                
                if accident_flags:
                    frame_positive = True
                    tracker_max_conf = max(prob for _, prob in accident_flags)
                    print(f"   [Tracker Alert] Frame {frame_idx}: Vehicles involved: {[vid for vid, _ in accident_flags]} with probabilities {[f'{prob:.2f}' for _, prob in accident_flags]}")

                # Check custom visual model detections
                accident_model_max_conf = 0.0
                has_accident_class = False
                for box in accident_result.boxes:
                    cls_id = int(box.cls[0])
                    confidence = float(box.conf[0])
                    label = _class_label(accident_model, cls_id).lower()
                    
                    is_accident = any(k in label for k in ["accident", "crash", "collision", "incident", "vandalism"])
                    
                    if is_accident and confidence >= req.conf:
                        has_accident_class = True
                        frame_positive = True
                        accident_model_max_conf = max(accident_model_max_conf, confidence)
                    elif not has_accident_class and confidence >= (req.conf + 0.1):
                        accident_model_max_conf = max(accident_model_max_conf, confidence)
                        frame_positive = True

                if frame_positive:
                    positive_frames += 1
                    max_conf = max(max_conf, accident_model_max_conf, tracker_max_conf)
                processed += 1
        finally:
            cap.release()

        if processed == 0:
            raise HTTPException(status_code=400, detail="No frames could be processed from source.")

        # If we saw an accident in ANY frame, it's an incident
        incidents_detected = 1 if positive_frames > 0 else 0
        
        result = {
            "incidentsDetected": incidents_detected,
            "confidence": round(max_conf, 2),
            "responseEta": "5-10 min" if incidents_detected > 0 else "--",
            "framesProcessed": processed,
            "positiveFrames": positive_frames
        }

        if incidents_detected > 0:
            print(f"🚨 ACCIDENT DETECTED: {positive_frames} positive frames for {req.source} (Confidence: {result['confidence']})")
        else:
            print(f"🚨 ACCIDENT CLEAR: No incident found in {processed} frames for {req.source}")

        return {
            "status": "ok",
            "provider": "fastapi-ultralytics",
            "result": result,
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ ACCIDENT ERROR: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/infer/congestion")
def infer_congestion(req: InferRequest):
    try:
        model = _load_congestion_model()
        tracker = AdvancedVehicleTracker()
        cap = _open_capture(req.source)

        processed = 0
        frame_idx = 0
        counts = []
        confidences = []

        try:
            while cap.isOpened() and processed < req.max_frames:
                ok, frame = cap.read()
                if not ok:
                    break
                frame_idx += 1
                if frame_idx % req.frame_stride != 0:
                    continue

                result = model(frame, conf=req.conf, verbose=False)[0]
                detections = []

                for box in result.boxes:
                    cls_id = int(box.cls[0])
                    confidence = float(box.conf[0])
                    label = _class_label(model, cls_id)
                    if not _is_vehicle_label(label):
                        continue
                    x1, y1, x2, y2 = box.xyxy[0].tolist()
                    center_x = (x1 + x2) / 2.0
                    center_y = (y1 + y2) / 2.0
                    
                    detections.append({
                        'bbox': [int(x1), int(y1), int(x2), int(y2)],
                        'center': (center_x, center_y),
                        'type': label,
                        'confidence': confidence
                    })
                    confidences.append(confidence)

                tracker.update_tracks(detections)
                counts.append(len(detections))
                processed += 1
        finally:
            cap.release()

        if processed == 0:
            raise HTTPException(status_code=400, detail="No frames could be processed from source.")

        # Calculate statistics from tracker
        total_tracked_vehicles = len(tracker.track_history)
        stopped_count = 0
        all_instant_speeds = []

        for vid, history in tracker.track_history.items():
            # Collect instant speeds
            for entry in history:
                all_instant_speeds.append(entry['speed'])
            
            # Determine if vehicle was mostly stopped/slow during its run
            if len(history) >= 2:
                v_speeds = [entry['speed'] for entry in history if entry['speed'] > 0]
                if v_speeds:
                    avg_v_speed = float(np.mean(v_speeds))
                    if avg_v_speed < 2.0:
                        stopped_count += 1
                else:
                    stopped_count += 1
            else:
                stopped_count += 1

        avg_vehicle_count = float(np.mean(counts)) if counts else 0.0
        peak_vehicle_count = int(np.max(counts)) if counts else 0
        avg_speed = float(np.mean(all_instant_speeds)) if all_instant_speeds else 0.0
        avg_conf = float(np.mean(confidences)) if confidences else 0.0
        stop_ratio = float(stopped_count / total_tracked_vehicles) if total_tracked_vehicles > 0 else 0.0
        
        # Calibration: Weighted blend of density, speed reduction, and stopped vehicles ratio
        if peak_vehicle_count == 0:
            index = 0
        else:
            density_factor = min(40, peak_vehicle_count * 4)
            speed_factor = max(0.0, 15.0 - avg_speed) * 3
            stop_factor = stop_ratio * 30
            index = int(min(100, max(0, round(density_factor + speed_factor + stop_factor))))

        if index >= 75:
            level = "Critical/High"
        elif index >= 50:
            level = "Moderate"
        elif index >= 25:
            level = "Low"
        else:
            level = "Clear"

        result = {
            "vehicleCount": peak_vehicle_count, # Returning Peak as the main count
            "avgVehicleCount": round(avg_vehicle_count, 1),
            "peakVehicleCount": peak_vehicle_count,
            "avgSpeed": round(avg_speed, 1),
            "index": index,
            "congestionLevel": level,
            "framesProcessed": processed,
            "detectionsFound": peak_vehicle_count > 0,
            "detectionQuality": round(avg_conf, 2)
        }
        
        if result["detectionsFound"]:
            print(f"📊 CONGESTION SUCCESS: Found avg {result['avgVehicleCount']} vehicles, index {index} ({level}) across {processed} frames.")
        else:
            print(f"📊 CONGESTION EMPTY: No vehicles found in {processed} frames for {req.source}")
            
        return {"status": "ok", "provider": "fastapi-ultralytics", "result": result}
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ CONGESTION ERROR: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn

    host = os.getenv("MODEL_SERVICE_HOST", "127.0.0.1")
    port = int(os.getenv("MODEL_SERVICE_PORT", "8001"))
    uvicorn.run("app:app", host=host, port=port, reload=False)
