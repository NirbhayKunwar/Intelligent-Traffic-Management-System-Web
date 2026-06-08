# ITMS REST API Reference

All API endpoints are prefixed with `/api` except health checks and metrics.

---

## 🟢 Health & Monitoring

### 1. Liveness Check
* **Method & Path**: `GET /health`
* **Description**: Confirms the container and Express server are running.
* **Response**:
  ```json
  {
    "status": "ok",
    "timestamp": "2026-06-08T09:00:00.000Z",
    "uptime": 120
  }
  ```

### 2. Deep Readiness Check
* **Method & Path**: `GET /health/deep`
* **Description**: Performs end-to-end checks on database connections, local FastAPI models, Email SMTP servers, and Cloudinary APIs.
* **Response (Success)**:
  ```json
  {
    "status": "ok",
    "timestamp": "2026-06-08T09:00:00.000Z",
    "services": {
      "database": "connected",
      "aiModelService": "connected",
      "emailSmtp": "connected",
      "cloudinary": "connected"
    }
  }
  ```

### 3. Prometheus Metrics
* **Method & Path**: `GET /prometheus/metrics`
* **Description**: Returns Prometheus-formatted request metrics, DB connection state, and active alert counters.

---

## 🔐 Authentication (`/api/auth`)

### 1. Register User
* **Method & Path**: `POST /api/auth/signup`
* **Payload**:
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword",
    "fullName": "John Doe",
    "role": "user"
  }
  ```

### 2. User Login
* **Method & Path**: `POST /api/auth/login`
* **Payload**:
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword"
  }
  ```
* **Response**: Sets HTTP-only `itms_token` cookie and returns user object.

### 3. Google OAuth Redirect
* **Method & Path**: `GET /api/auth/google?mode=login`
* **Description**: Initiates Google authentication redirect.

---

## 📹 Cameras (`/api/cameras`)

### 1. List Cameras
* **Method & Path**: `GET /api/cameras`
* **Authentication**: Required

### 2. Create Camera
* **Method & Path**: `POST /api/cameras`
* **Authentication**: Required (Operator role only)
* **Payload**:
  ```json
  {
    "name": "Dehradun Crossroads",
    "url": "http://stream-url.mp4",
    "stream": "Auto",
    "latitude": 30.3165,
    "longitude": 78.0322,
    "modelHint": "congestion"
  }
  ```

---

## 🚨 Alerts (`/api/alerts`)

### 1. List Alerts
* **Method & Path**: `GET /api/alerts`
* **Query Parameters**:
  * `active` (boolean, optional)
  * `type` (`congestion` | `accident`, optional)

---

## 🤖 Inference (`/api/inference`)

### 1. Queue Inference Job
* **Method & Path**: `POST /api/inference/jobs`
* **Authentication**: Required (Operator role only)
* **Payload**:
  ```json
  {
    "type": "congestion",
    "sourceType": "camera",
    "sourceId": "cam_nanoid_123",
    "threshold": 15
  }
  ```
