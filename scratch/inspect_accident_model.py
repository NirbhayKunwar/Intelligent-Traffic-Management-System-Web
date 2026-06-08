import os
from ultralytics import YOLO

BASE_DIR = r"c:\Users\nirbh\Desktop\Capstone\apps\ai"
ACCIDENT_MODEL_PATH = os.path.join(BASE_DIR, "models", "Accident model", "best.pt")

if os.path.exists(ACCIDENT_MODEL_PATH):
    model = YOLO(ACCIDENT_MODEL_PATH)
    print("Accident Model Names:", model.names)
else:
    print("Accident model not found at", ACCIDENT_MODEL_PATH)
