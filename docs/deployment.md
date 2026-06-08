# ITMS Deployment Guide

This guide describes how to deploy the Intelligent Traffic Management System (ITMS) as a unified single-container or monorepo package on cloud providers (Render, Railway, Fly.io, or VPS).

---

## 🔑 Required Environment Variables

Configure these variables in your hosting provider's dashboard:

```ini
PORT=4000
NODE_ENV=production
JWT_SECRET=your-secure-jwt-secret
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/itms

# Google OAuth (Authentication)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://your-domain.com/api/auth/google/callback

# Cloudinary (Media upload)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email Dispatch
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-specific-password
```

---

## 🐳 Docker Deployment (VPS, AWS, EC2)

You can build and deploy the application as a single Docker container that automatically runs the Express backend (serving React static files) and the Python FastAPI detection service concurrently under PM2.

1. **Build the Docker Image**
   ```bash
   docker build -t itms-app -f infrastructure/Dockerfile .
   ```

2. **Run the Container**
   ```bash
   docker run -d -p 4000:4000 --env-file apps/api/data/.env --name itms-running-app itms-app
   ```

---

## 🚄 Platform-Specific Deployments

### 1. Railway.app
Railway automatically detects Dockerfiles.
1. Connect your Github repository.
2. In Railway, add a new service from your repository.
3. Railway will pick up `infrastructure/Dockerfile` automatically (or you can point Railway to it in Settings -> General -> Dockerfile Path: `infrastructure/Dockerfile`).
4. Expose Port `4000` under Service settings.
5. Define the Environment Variables in the Variables tab.

### 2. Render.com
1. Click **New** -> **Web Service** in your Render Dashboard.
2. Connect your Github repository.
3. Select **Docker** as the Environment.
4. Under Advanced settings, set the Dockerfile Path to `infrastructure/Dockerfile`.
5. Add your Environment variables under the Env Variables tab.
6. Render will automatically detect exposed port `4000` and route traffic to it.
