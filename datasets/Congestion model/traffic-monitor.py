import cv2
import numpy as np
from collections import deque, defaultdict
import pathlib
temp = pathlib.PosixPath
pathlib.PosixPath = pathlib.WindowsPath
import torch

# ════════════════════════════════════════════════════════════
#  CONFIG
# ════════════════════════════════════════════════════════════
VEHICLE_CLASSES = [0, 1, 2, 4, 5, 6, 8, 9, 10, 11, 12, 15, 16, 17, 18, 19] # Ambulance, bus, car, motorbike, truck etc.
CONF_THRESHOLD  = 0.25

HISTORY_LEN     = 14

# ── Congestion ───────────────────────────────────────────────
CONG_COUNT_HARD         = 20    # always congested regardless of speed
CONG_COUNT_SOFT         = 12    # congested only if avg speed also slow
CONG_SPEED_THRESH       = 3.5   # px/frame (rolling avg) for soft congestion
CONG_CONFIRM_FRAMES     = 12    # must be detected this many frames before alert
CONG_RELEASE_FRAMES     = 20    # must clear this many frames before releasing


# ════════════════════════════════════════════════════════════
#  ROI POLYGON SELECTOR
# ════════════════════════════════════════════════════════════
roi_points   = []
drawing_done = False

def mouse_callback(event, x, y, flags, param):
    global roi_points, drawing_done
    if drawing_done:
        return
    if event == cv2.EVENT_LBUTTONDOWN:
        roi_points.append((x, y))

def select_roi(frame):
    global roi_points, drawing_done
    roi_points   = []
    drawing_done = False

    clone = frame.copy()
    cv2.namedWindow('Select Lane ROI', cv2.WINDOW_NORMAL)
    cv2.resizeWindow('Select Lane ROI', 1280, 720)
    cv2.setMouseCallback('Select Lane ROI', mouse_callback)

    print("\n── ROI SELECTION ──────────────────────────────")
    print("  Click to place polygon points around the lane")
    print("  ENTER  -> confirm polygon")
    print("  C      -> clear and start over")
    print("  Q      -> skip ROI (full frame used)")
    print("───────────────────────────────────────────────\n")

    while True:
        display = clone.copy()
        for i, pt in enumerate(roi_points):
            cv2.circle(display, pt, 6, (0, 255, 255), -1)
            if i > 0:
                cv2.line(display, roi_points[i-1], pt, (0, 255, 255), 2)
        if len(roi_points) > 2:
            cv2.line(display, roi_points[-1], roi_points[0], (0, 255, 255), 2)
            overlay = display.copy()
            cv2.fillPoly(overlay, [np.array(roi_points)], (0, 255, 255))
            cv2.addWeighted(overlay, 0.15, display, 0.85, 0, display)
        cv2.putText(display,
                    f'Points: {len(roi_points)}  |  ENTER=confirm  C=clear  Q=skip',
                    (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
        cv2.imshow('Select Lane ROI', display)
        key = cv2.waitKey(1) & 0xFF
        if key == 13:
            if len(roi_points) >= 3:
                drawing_done = True
                break
            else:
                print("  Need at least 3 points!")
        elif key == ord('c'):
            roi_points = []
            print("  Cleared — start again")
        elif key == ord('q'):
            roi_points = []
            print("  Skipped — using full frame as lane zone")
            break

    cv2.destroyWindow('Select Lane ROI')
    return np.array(roi_points, dtype=np.int32) if len(roi_points) >= 3 else None


# ════════════════════════════════════════════════════════════
#  GEOMETRY HELPERS
# ════════════════════════════════════════════════════════════
def get_iou(b1, b2):
    x1, y1 = max(b1[0], b2[0]), max(b1[1], b2[1])
    x2, y2 = min(b1[2], b2[2]), min(b1[3], b2[3])
    inter   = max(0, x2-x1) * max(0, y2-y1)
    a1 = (b1[2]-b1[0]) * (b1[3]-b1[1])
    a2 = (b2[2]-b2[0]) * (b2[3]-b2[1])
    union = a1 + a2 - inter
    return inter / union if union > 0 else 0

def get_aspect(box):
    w = box[2]-box[0]; h = box[3]-box[1]
    return w / h if h > 0 else 0

def get_center(box):
    return (int((box[0]+box[2]) // 2), int((box[1]+box[3]) // 2))

def get_dist(c1, c2):
    return float(np.sqrt((c1[0]-c2[0])**2 + (c1[1]-c2[1])**2))

def box_diag(box):
    return float(np.sqrt((box[2]-box[0])**2 + (box[3]-box[1])**2))

def dot2d(v1, v2):
    return v1[0]*v2[0] + v1[1]*v2[1]

def mag2d(v):
    return float(np.sqrt(v[0]**2 + v[1]**2))

def box_in_polygon(box, polygon):
    if polygon is None:
        return True
    cx, cy = get_center(box)
    return cv2.pointPolygonTest(polygon, (float(cx), float(cy)), False) >= 0

def pair_key(a, b):
    return (min(a, b), max(a, b))


# ════════════════════════════════════════════════════════════
#  SIMPLE IOU TRACKER
# ════════════════════════════════════════════════════════════
class SimpleTracker:
    def __init__(self, max_lost=5):
        self.next_id = 1
        self.tracks = {}

    def update(self, det_boxes):
        new_tracks = {}
        unmatched_dets = list(det_boxes)
        
        for tid, track in list(self.tracks.items()):
            best_iou = 0
            best_det = None
            for det in unmatched_dets:
                iou = get_iou(track["box"], det)
                if iou > best_iou:
                    best_iou = iou
                    best_det = det
            
            if best_iou > 0.3:
                new_tracks[tid] = {"box": best_det, "lost": 0}
                unmatched_dets.remove(best_det)
            else:
                track["lost"] += 1
                if track["lost"] < 5:
                    new_tracks[tid] = track
                    
        for det in unmatched_dets:
            new_tracks[self.next_id] = {"box": det, "lost": 0}
            self.next_id += 1
            
        self.tracks = new_tracks
        return {tid: t["box"] for tid, t in self.tracks.items() if t["lost"] == 0}


# ════════════════════════════════════════════════════════════
#  PER-VEHICLE HISTORY
# ════════════════════════════════════════════════════════════
class VehicleHistory:
    """Stores per-frame snapshots for a single tracked vehicle."""
    def __init__(self):
        self.box    = deque(maxlen=HISTORY_LEN)
        self.center = deque(maxlen=HISTORY_LEN)
        self.speed  = deque(maxlen=HISTORY_LEN)
        self.aspect = deque(maxlen=HISTORY_LEN)

    def push(self, box):
        """Call AFTER tracking."""
        c = get_center(box)
        spd = get_dist(c, self.center[-1]) if self.center else 0.0
        self.box.append(list(box))
        self.center.append(c)
        self.speed.append(spd)
        self.aspect.append(get_aspect(box))

    def recent_avg_speed(self, n=5):
        speeds = list(self.speed)[-n:]
        return float(np.mean(speeds)) if speeds else 0.0

    def ready(self, min_frames=2):
        return len(self.center) >= min_frames


# ════════════════════════════════════════════════════════════
#  CONGESTION SMOOTHER
# ════════════════════════════════════════════════════════════
class CongestionSmoother:
    def __init__(self):
        self._trigger = 0
        self._clear   = 0
        self._active  = False

    def update(self, raw):
        if raw:
            self._trigger += 1; self._clear = 0
        else:
            self._clear   += 1; self._trigger = 0
        if not self._active and self._trigger >= CONG_CONFIRM_FRAMES:
            self._active = True
        if self._active and self._clear >= CONG_RELEASE_FRAMES:
            self._active = False
        return self._active


def raw_congestion_check(current_boxes, histories, polygon):
    in_lane  = [tid for tid, box in current_boxes.items()
                if box_in_polygon(box, polygon)]
    count    = len(in_lane)
    speeds   = [histories[tid].recent_avg_speed(5)
                for tid in in_lane
                if tid in histories and histories[tid].ready(3)]
    avg_spd  = float(np.mean(speeds)) if speeds else 99.0

    if count >= CONG_COUNT_HARD:
        return True, count, avg_spd
    if count >= CONG_COUNT_SOFT and avg_spd < CONG_SPEED_THRESH:
        return True, count, avg_spd
    return False, count, avg_spd


# ════════════════════════════════════════════════════════════
#  DRAW HELPERS
# ════════════════════════════════════════════════════════════
def draw_polygon_zone(frame, polygon):
    if polygon is None:
        return frame
    overlay = frame.copy()
    cv2.fillPoly(overlay, [polygon], (255, 255, 0))
    cv2.addWeighted(overlay, 0.12, frame, 0.88, 0, frame)
    cv2.polylines(frame, [polygon], isClosed=True, color=(255, 255, 0), thickness=2)
    cv2.putText(frame, 'LANE ZONE',
                (polygon[0][0]+5, polygon[0][1]-8),
                cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 0), 2)
    return frame

def draw_alert(frame, text, y_pos, color):
    cv2.putText(frame, text, (30, y_pos), cv2.FONT_HERSHEY_SIMPLEX, 1.1, (0,0,0),   5)
    cv2.putText(frame, text, (30, y_pos), cv2.FONT_HERSHEY_SIMPLEX, 1.1, color,      3)

def draw_status_bar(canvas, H, W, congested, vcount, avg_speed):
    cong_col = (0, 140, 255) if congested else (0, 200, 0)
    overlay  = canvas.copy()
    cv2.rectangle(overlay, (0, H), (W, H+36), (20, 20, 20), -1)
    cv2.addWeighted(overlay, 0.8, canvas, 0.2, 0, canvas)
    cong_txt = (f"CONGESTION: {'YES' if congested else 'NO '}"
                f"  |  Vehicles: {vcount}"
                f"  |  Avg spd: {avg_speed:.1f}px/f")
    cv2.putText(canvas, cong_txt, (10, H+26), cv2.FONT_HERSHEY_SIMPLEX, 0.65, cong_col, 2)


# ════════════════════════════════════════════════════════════
#  MAIN PIPELINE
# ════════════════════════════════════════════════════════════
def run_pipeline(video_path):

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print(f"ERROR: Cannot open — {video_path}")
        return

    W   = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    H   = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    FPS = int(cap.get(cv2.CAP_PROP_FPS)) or 25

    ret, first_frame = cap.read()
    if not ret:
        print("ERROR: Cannot read first frame"); cap.release(); return

    print(f"\nVideo: {video_path}  ({W}x{H} @ {FPS}fps)")

    polygon = select_roi(first_frame)
    print(f"Lane polygon set with {len(polygon)} points"
          if polygon is not None else "No ROI — using full frame")

    cap.set(cv2.CAP_PROP_POS_FRAMES, 0)

    # Output video writing has been disabled
    # out = cv2.VideoWriter(output_path, ...

    print("\nLoading PyTorch Hub YOLOv5 model...")
    model = torch.hub.load('ultralytics/yolov5', 'custom', path='traffic-model.pt')
    tracker = SimpleTracker()

    histories  = {}
    cong_sm    = CongestionSmoother()

    frame_num  = 0
    cng_frames = 0

    cv2.namedWindow('Traffic Monitor', cv2.WINDOW_NORMAL)
    cv2.resizeWindow('Traffic Monitor', 1280, 720)

    print(f"\nRunning detection... Press Q or ESC to quit early\n")

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        frame_num += 1

        canvas        = np.zeros((H+36, W, 3), dtype=np.uint8)
        canvas[:H]    = frame

        # ── 1. YOLO tracking ───────────────────────────────────────────
        results = model(frame, size=1280)
        det_boxes = []
        # results.xyxy[0] is tensor of shape (N, 6) -> [x1, y1, x2, y2, conf, cls]
        for det in results.xyxy[0]:
            x1, y1, x2, y2, conf, cls = det.tolist()
            if int(cls) in VEHICLE_CLASSES and conf >= CONF_THRESHOLD:
                det_boxes.append([float(x1), float(y1), float(x2), float(y2)])
                
        current_boxes = tracker.update(det_boxes)

        # ── 2. Initialise history for brand-new tracks ─────────────────
        for tid in current_boxes:
            if tid not in histories:
                histories[tid] = VehicleHistory()

        # ── 3. Push current frame into history ──────────────────────
        for tid, box in current_boxes.items():
            histories[tid].push(box)

        # ── 4. Congestion (uses updated history for rolling speeds) ─────
        raw_cong, vcount, avg_spd = raw_congestion_check(
            current_boxes, histories, polygon)
        congested = cong_sm.update(raw_cong)

        # ── 5. Draw ────────────────────────────────────────────────────
        canvas[:H] = draw_polygon_zone(canvas[:H], polygon)

        for tid, box in current_boxes.items():
            x1, y1, x2, y2 = map(int, box)
            in_l = box_in_polygon(box, polygon)

            if in_l and congested:
                color = (0, 140, 255)       # Orange — congested
            elif in_l:
                color = (255, 255, 0)       # Yellow — in lane, normal
            else:
                color = (0, 220, 0)         # Green — outside lane

            cv2.rectangle(canvas[:H], (x1, y1), (x2, y2), color, 2)
            cv2.putText(canvas[:H], f'ID:{tid}',
                        (x1, max(y1-6, 12)), cv2.FONT_HERSHEY_SIMPLEX,
                        0.48, color, 2)

        status_text = "CONGESTION DETECTED!" if congested else "Good Flow"
        status_color = (0, 0, 255) if congested else (0, 255, 0) # Red for danger, Green for good

        # Draw the Text HUD on the screen top-left
        cv2.putText(canvas[:H], f"Active Vehicles: {vcount}", (30, 50), cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 0, 0), 6)
        cv2.putText(canvas[:H], f"Active Vehicles: {vcount}", (30, 50), cv2.FONT_HERSHEY_SIMPLEX, 1.2, status_color, 3)
        cv2.putText(canvas[:H], f"Traffic Status: {status_text}", (30, 100), cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 0, 0), 6)
        cv2.putText(canvas[:H], f"Traffic Status: {status_text}", (30, 100), cv2.FONT_HERSHEY_SIMPLEX, 1.2, status_color, 3)

        if congested:
            cng_frames += 1

        draw_status_bar(canvas, H, W, congested, vcount, avg_spd)
        # out.write(canvas)  # Disabled output video export

        cv2.imshow('Traffic Monitor', canvas)
        key = cv2.waitKey(1) & 0xFF
        if key == ord('q'):
            print("Skipped to next video by user (Press ESC to fully exit).")
            break
        elif key == 27:  # 27 is the ESC key
            print("\n*** FULLY EXITED SCRIPT VIA ESC KEY ***")
            import sys
            cap.release(); cv2.destroyAllWindows()
            sys.exit(0)

        if frame_num % 50 == 0:
            print(f"  Frame {frame_num:4d} | "
                  f"Congested: {'YES' if congested else 'no '} | "
                  f"Vehicles: {vcount}  "
                  f"AvgSpd: {avg_spd:.1f}")

    cap.release(); cv2.destroyAllWindows()
    print(f"\n{'='*55}")
    print(f"DONE processing {video_path}")
    print(f"Total frames      : {frame_num}")
    print(f"Congestion frames : {cng_frames}")
    print(f"{'='*55}\n")


# ════════════════════════════════════════════════════════════
#  RUN
# ════════════════════════════════════════════════════════════
import glob
import sys

if __name__ == '__main__':
    # ── OPTION 1: Run a single specific video ────────────────────
    # Make sure to uncomment these 3 lines if you just want to test one video!
    # single_video_path = "Cam1.mp4"
    # run_pipeline(single_video_path)
    # sys.exit(0) # This stops it from running Option 2 below


    # ── OPTION 2: Process all videos in folder automatically ─────
    # Grab all MP4s in the current folder, ignoring any already processed *_output.mp4 videos
    videos = [v for v in glob.glob('*.mp4') if not v.endswith('_output.mp4')]
    
    if not videos:
        print("\nDidn't find any .mp4 videos in the current folder!")
    else:
        print(f"\nFound {len(videos)} videos to process!")
        
    for v in videos:
        run_pipeline(v)
