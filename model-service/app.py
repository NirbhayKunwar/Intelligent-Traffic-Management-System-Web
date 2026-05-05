import os
from typing import Literal, Optional

import cv2
import numpy as np
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from ultralytics import YOLO


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ACCIDENT_MODEL_PATH = os.getenv(
    "ACCIDENT_MODEL_PATH",
    os.path.abspath(os.path.join(BASE_DIR, "..", "datasets", "Accident model", "best.pt")),
)
CONGESTION_MODEL_PATH = os.getenv(
    "CONGESTION_MODEL_PATH", 
    os.path.abspath(os.path.join(BASE_DIR, "..", "datasets", "Congestion model", "traffic-model.pt"))
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
        model = _load_accident_model()
        cap = _open_capture(req.source)

        processed = 0
        positive_frames = 0
        max_conf = 0.0
        has_accident_class = False
        frame_idx = 0

        try:
            while cap.isOpened() and processed < req.max_frames:
                ok, frame = cap.read()
                if not ok:
                    break
                frame_idx += 1
                if frame_idx % req.frame_stride != 0:
                    continue

                result = model(frame, conf=req.conf, verbose=False)[0]
                frame_positive = False

                for box in result.boxes:
                    cls_id = int(box.cls[0])
                    confidence = float(box.conf[0])
                    label = _class_label(model, cls_id).lower()
                    
                    # More reliable detection: Check for various accident-related synonyms
                    is_accident = any(k in label for k in ["accident", "crash", "collision", "incident", "vandalism"])
                    
                    if is_accident and confidence >= req.conf:
                        has_accident_class = True
                        frame_positive = True
                        max_conf = max(max_conf, confidence)
                    elif not has_accident_class and confidence >= (req.conf + 0.1):
                        # If model has no explicit "accident" class name, treat strong detections as potential incidents
                        max_conf = max(max_conf, confidence)
                        frame_positive = True

                if frame_positive:
                    positive_frames += 1
                processed += 1
        finally:
            cap.release()

        if processed == 0:
            raise HTTPException(status_code=400, detail="No frames could be processed from source.")

        # Updated logic: If we saw an accident in ANY frame, it's an incident
        incidents_detected = 1 if positive_frames > 0 else 0
        
        result = {
            "incidentsDetected": incidents_detected,
            "confidence": round(max_conf, 2),
            "responseEta": "5-10 min" if incidents_detected > 0 else "--",
            "framesProcessed": processed,
            "positiveFrames": positive_frames
        }

        if incidents_detected > 0:
            print(f"🚨 ACCIDENT DETECTED: {positive_frames} positive frames for {req.source}")
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
        cap = _open_capture(req.source)

        processed = 0
        frame_idx = 0
        counts = []
        speeds = []
        confidences = []
        prev_centers = []

        try:
            while cap.isOpened() and processed < req.max_frames:
                ok, frame = cap.read()
                if not ok:
                    break
                frame_idx += 1
                if frame_idx % req.frame_stride != 0:
                    continue

                result = model(frame, conf=req.conf, verbose=False)[0]
                curr_centers = []
                vehicle_count = 0

                for box in result.boxes:
                    cls_id = int(box.cls[0])
                    confidence = float(box.conf[0])
                    label = _class_label(model, cls_id)
                    if not _is_vehicle_label(label):
                        continue
                    x1, y1, x2, y2 = box.xyxy[0].tolist()
                    cx = (float(x1) + float(x2)) / 2.0
                    cy = (float(y1) + float(y2)) / 2.0
                    curr_centers.append((cx, cy))
                    vehicle_count += 1
                    confidences.append(confidence)

                counts.append(vehicle_count)
                speeds.extend(_nearest_speeds(prev_centers, curr_centers))
                prev_centers = curr_centers
                processed += 1
        finally:
            cap.release()

        if processed == 0:
            raise HTTPException(status_code=400, detail="No frames could be processed from source.")

        avg_vehicle_count = float(np.mean(counts)) if counts else 0.0
        peak_vehicle_count = int(np.max(counts)) if counts else 0
        avg_speed = float(np.mean(speeds)) if speeds else 0.0
        avg_conf = float(np.mean(confidences)) if confidences else 0.0
        
        # Calibration: yolov8n is sensitive. We use a weighted blend of peak density and speed
        # Peak density is better for intersection congestion
        index = int(min(100, max(0, round(peak_vehicle_count * 6 + max(0.0, 15.0 - avg_speed) * 3))))

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
            print(f"📊 CONGESTION SUCCESS: Found avg {result['avgVehicleCount']} vehicles across {processed} frames.")
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
