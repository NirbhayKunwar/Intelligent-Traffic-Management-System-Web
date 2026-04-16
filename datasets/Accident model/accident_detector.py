"""
accident_detector.py
─────────────────────────────────────────────────────────────────────────────
Production-grade real-time accident detector using a custom-trained YOLOv8
model (best.pt) that directly detects accidents in video/CCTV feeds.

Features:
  - Direct accident detection using custom YOLO model (class: 'Accident')
  - Temporal smoothing: alert only after N consecutive positive frames
  - Cooldown period to prevent alert spam
  - Graceful handling of bad/missing frames
  - Optional output video saving
  - Clean, professional HUD overlay
"""

import argparse
import sys
import time
import cv2
import numpy as np
from ultralytics import YOLO

# ─────────────────────────────────────────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────────────────────────────────────────
WINDOW_SIZE     = 12   # look at last N frames
DETECT_THRESH   = 4    # if detected in >=4 out of last 12 frames -> alert
COOLDOWN_FRAMES = 90   # frames before a second alert can fire (~3s at 30fps)
MAX_SKIP_FRAMES = 5    # max consecutive unreadable frames before stopping


def draw_label(frame, text, pos, color, font_scale=1.0, thickness=2):
    """Draw text with a dark semi-transparent background for readability."""
    font = cv2.FONT_HERSHEY_SIMPLEX
    (tw, th), bl = cv2.getTextSize(text, font, font_scale, thickness)
    x, y = pos
    pad = 6
    cv2.rectangle(frame,
                  (x - pad, y - th - bl - pad),
                  (x + tw + pad, y + bl + pad),
                  (20, 20, 20), -1)
    cv2.putText(frame, text, (x, y), font, font_scale, color, thickness, cv2.LINE_AA)


def main():
    parser = argparse.ArgumentParser(description="Real-Time Accident Detector (YOLO)")
    parser.add_argument("--video", type=str, required=True,
                        help="Path to video file or '0' for webcam.")
    parser.add_argument("--model", type=str, default="best.pt",
                        help="Path to trained YOLO weights (default: best.pt).")
    parser.add_argument("--conf", type=float, default=0.40,
                        help="Detection confidence threshold (0–1). Default: 0.40")
    parser.add_argument("--save", type=str, default=None,
                        help="Optional path to save annotated output video (e.g. out.mp4).")
    args = parser.parse_args()

    # ── Load model ────────────────────────────────────────────────────────────
    print(f"[*] Loading model: {args.model}")
    try:
        model = YOLO(args.model)
        print(f"[*] Model classes: {model.names}")
    except Exception as e:
        print(f"[!] Failed to load model: {e}")
        sys.exit(1)

    # ── Open video ────────────────────────────────────────────────────────────
    source = int(args.video) if args.video.isdigit() else args.video
    cap    = cv2.VideoCapture(source)
    if not cap.isOpened():
        print(f"[!] Cannot open video: {source}")
        sys.exit(1)

    fps  = cap.get(cv2.CAP_PROP_FPS) or 25
    fw   = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    fh   = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    print(f"[*] Video: {fw}x{fh} @ {fps:.1f} fps  |  conf={args.conf}")

    disp_w = min(fw, 1280)
    disp_h = min(fh, 720)

    # ── Optional video writer ─────────────────────────────────────────────────
    writer = None
    if args.save:
        fourcc = cv2.VideoWriter_fourcc(*"mp4v")
        writer = cv2.VideoWriter(args.save, fourcc, fps, (disp_w, disp_h))
        print(f"[*] Saving output to: {args.save}")

    # ── State ─────────────────────────────────────────────────────────────────
    detection_window = []  # sliding window of booleans (detected or not)
    cooldown_count   = 0   # frames remaining in cooldown
    accident_active  = False
    skip_count       = 0
    frame_count      = 0

    print("[*] Running… Press 'q' to quit.\n")

    try:
        while cap.isOpened():
            ret, frame = cap.read()

            # Handle bad frames
            if not ret:
                skip_count += 1
                if skip_count >= MAX_SKIP_FRAMES:
                    print("[*] Stream ended or too many bad frames. Stopping.")
                    break
                continue
            skip_count   = 0
            frame_count += 1

            # ── Run inference ─────────────────────────────────────────────────
            try:
                results = model(frame, conf=args.conf, verbose=False)[0]
            except Exception as e:
                print(f"[!] Inference error frame {frame_count}: {e}")
                continue

            # ── Parse detections ──────────────────────────────────────────────
            accident_detections = []
            for box in results.boxes:
                cls_id = int(box.cls[0])
                conf   = float(box.conf[0])
                if model.names[cls_id].lower() == "accident":
                    x1, y1, x2, y2 = map(int, box.xyxy[0])
                    accident_detections.append((x1, y1, x2, y2, conf))

            detected_this_frame = len(accident_detections) > 0

            # ── Draw detection boxes ──────────────────────────────────────────
            for (x1, y1, x2, y2, conf) in accident_detections:
                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 255), 3)
                cv2.putText(frame, f"Accident {conf:.2f}",
                            (x1, y1 - 8), cv2.FONT_HERSHEY_SIMPLEX,
                            0.65, (0, 0, 255), 2, cv2.LINE_AA)

            # ── Sliding window temporal smoothing ─────────────────────────────
            detection_window.append(detected_this_frame)
            if len(detection_window) > WINDOW_SIZE:
                detection_window.pop(0)

            detections_in_window = sum(detection_window)

            if cooldown_count > 0:
                cooldown_count -= 1
                accident_active = True
            else:
                accident_active = False

            if detections_in_window >= DETECT_THRESH and cooldown_count == 0:
                accident_active = True
                cooldown_count  = COOLDOWN_FRAMES
                detection_window.clear()
                ts = time.strftime("%H:%M:%S")
                print(f"  [ALERT][{ts}] ACCIDENT DETECTED on frame {frame_count}!")

            # ── Resize for display ────────────────────────────────────────────
            display = cv2.resize(frame, (disp_w, disp_h))

            # ── HUD overlay ───────────────────────────────────────────────────
            if accident_active:
                # Red translucent banner
                overlay = display.copy()
                cv2.rectangle(overlay, (0, 0), (disp_w, 75), (0, 0, 180), -1)
                cv2.addWeighted(overlay, 0.5, display, 0.5, 0, display)
                draw_label(display, "  ACCIDENT DETECTED!  ",
                           (15, 55), (255, 255, 255), font_scale=1.4, thickness=3)
            else:
                status = f"Normal  |  Frame: {frame_count}"
                if detected_this_frame:
                    status = f"Confirming... ({detections_in_window}/{DETECT_THRESH})  |  Frame: {frame_count}"
                draw_label(display, status, (10, 35),
                           (0, 230, 80), font_scale=0.75, thickness=2)

            # Confirmation progress bar
            if detections_in_window > 0 and not accident_active:
                bar_w = int((detections_in_window / DETECT_THRESH) * 250)
                cv2.rectangle(display, (10, disp_h - 18),
                              (10 + bar_w, disp_h - 6), (0, 60, 255), -1)
                cv2.putText(display, "Confirming accident...",
                            (270, disp_h - 8), cv2.FONT_HERSHEY_SIMPLEX,
                            0.45, (180, 180, 180), 1)

            cv2.imshow("ITMS – Accident Detection", display)
            if writer:
                writer.write(display)

            if cv2.waitKey(1) & 0xFF == ord("q"):
                print("[*] Quit by user.")
                break

    except KeyboardInterrupt:
        print("\n[*] Interrupted.")
    finally:
        cap.release()
        if writer:
            writer.release()
        cv2.destroyAllWindows()
        print("[*] Done.")


if __name__ == "__main__":
    main()
