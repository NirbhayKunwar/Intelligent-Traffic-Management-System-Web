---
title: ITMS AI
emoji: 🚦
colorFrom: blue
colorTo: green
sdk: docker
app_port: 7860
pinned: false
---

# ITMS Model Service

FastAPI service that runs the ML models and returns normalized JSON outputs for the Capstone backend.

## Endpoints

- `GET /health`
- `POST /infer/accident`
- `POST /infer/congestion`

## Request Body

```json
{
  "source_type": "camera",
  "source": "rtsp://your-camera-url-or-video-path.mp4",
  "threshold": 65,
  "conf": 0.4,
  "frame_stride": 12,
  "max_frames": 180
}
```

## Setup

1. Create a Python venv and activate it.
2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Run service:

```bash
python app.py
```

Service starts on `http://127.0.0.1:8001`.

## Model Paths

Defaults:

- Accident model: `models/Accident model/best.pt`
- Congestion model: `models/Congestion model/traffic-model.pt`

Override with env vars:

- `ACCIDENT_MODEL_PATH`
- `CONGESTION_MODEL_PATH`
- `MODEL_SERVICE_HOST`
- `MODEL_SERVICE_PORT`

## Backend Integration

In `apps/api/data/.env`:

```env
MODEL_SERVICE_URL=http://127.0.0.1:8001
MODEL_SERVICE_TIMEOUT_MS=90000
MODEL_SERVICE_STRICT=false
```

If `MODEL_SERVICE_STRICT=true`, backend returns an error when the service is down.
If `false`, backend falls back to mock inference output.
