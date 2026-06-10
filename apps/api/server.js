import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";
import express from "express";
import cookieParser from "cookie-parser";
import session from "express-session";
import passport from "passport";
import { connectDB, closeDB } from "./config/db.js";
import { configurePassport } from "./config/passport.js";
import { requestLogger, logger } from "./middleware/logger.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { 
  corsMiddleware, 
  helmetMiddleware, 
  compressionMiddleware, 
  standardRateLimiter,
  authRateLimiter 
} from "./middleware/security.js";
import { setupMetricsMiddleware } from "../../monitoring/metrics.js";

// Feature Routes
import authRoutes from "./modules/auth/auth.routes.js";
import cameraRoutes from "./modules/camera/camera.routes.js";
import alertRoutes from "./modules/alert/alert.routes.js";
import inferenceRoutes from "./modules/inference/inference.routes.js";
import settingsRoutes from "./modules/settings/settings.routes.js";
import uploadRoutes from "./modules/upload/upload.routes.js";
import metricsRoutes from "./modules/metrics/metrics.routes.js";
import userRoutes from "./modules/user/user.routes.js";

// Deep Health dependencies
import mongoose from "mongoose";
import { verifyModelServiceHealth } from "./services/aiService.js";
import { verifyEmailTransporter } from "./services/emailService.js";
import { cloudinary } from "./config/cloudinary.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Explicitly load root-level .env
const rootEnvPath = path.resolve(__dirname, "..", "..", ".env");
if (existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath, override: true });
}

// Explicitly load app-level .env (takes precedence)
const dataEnvPath = path.join(__dirname, "data", ".env");
if (existsSync(dataEnvPath)) {
  dotenv.config({ path: dataEnvPath, override: true });
}

const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";
const isProduction = process.env.NODE_ENV === "production";

// Connect to Database
await connectDB();

const app = express();

// Trust reverse proxy headers in production (for Heroku, Render, etc. to get correct IP)
if (isProduction) {
  app.set("trust proxy", 1);
}

// Prometheus Monitoring setup (Wired BEFORE standard request loggers)
setupMetricsMiddleware(app);

// Core Middlewares
app.use(helmetMiddleware);
app.use(compressionMiddleware);
app.use("/api", corsMiddleware);
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));
app.use(cookieParser());
app.use(requestLogger);

// Session Store Setup (For Google OAuth Passport support)
app.use(session({
  secret: JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: isProduction ? "none" : "lax",
    secure: isProduction,
    maxAge: 1000 * 60 * 60 * 24, // 24 hours
  },
}));

// Initialize Passport strategy
configurePassport();
app.use(passport.initialize());
app.use(passport.session());

// Google OAuth callback fallback handler (for direct port 4000/auth/google/callback)
import { handleGoogleCallback } from "./modules/auth/auth.controller.js";
app.get("/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login?oauth=failed", session: false }),
  handleGoogleCallback
);

// Standard rate limiters
app.use("/api/auth/login", authRateLimiter);
app.use("/api/auth/signup", authRateLimiter);
app.use("/api/", standardRateLimiter);

// Liveness Health Check
app.get("/health", (req, res) => {
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(), 
    uptime: Math.round(process.uptime()) 
  });
});

// Deep Health Check
app.get("/health/deep", async (req, res) => {
  const healthStatus = {
    status: "ok",
    timestamp: new Date().toISOString(),
    services: {
      database: "unknown",
      aiModelService: "unknown",
      emailSmtp: "unknown",
      cloudinary: "unknown"
    }
  };

  let hasFailures = false;

  // 1. Verify MongoDB connection state
  try {
    const dbConnected = mongoose.connection.readyState === 1;
    healthStatus.services.database = dbConnected ? "connected" : "disconnected";
    if (!dbConnected) hasFailures = true;
  } catch (err) {
    healthStatus.services.database = `error: ${err.message}`;
    hasFailures = true;
  }

  // 2. Verify AI model service microservice
  try {
    const aiHealthy = await verifyModelServiceHealth();
    healthStatus.services.aiModelService = aiHealthy ? "connected" : "offline";
    if (!aiHealthy) hasFailures = true;
  } catch (err) {
    healthStatus.services.aiModelService = `error: ${err.message}`;
    hasFailures = true;
  }

  // 3. Verify Nodemailer transporter
  try {
    const emailActive = await verifyEmailTransporter();
    healthStatus.services.emailSmtp = emailActive ? "connected" : "credentials_missing_or_failed";
  } catch (err) {
    healthStatus.services.emailSmtp = `error: ${err.message}`;
  }

  // 4. Verify Cloudinary connectivity
  try {
    const cloudPing = await cloudinary.api.ping();
    healthStatus.services.cloudinary = cloudPing?.status === "ok" ? "connected" : "failed";
  } catch (err) {
    healthStatus.services.cloudinary = `error: ${err.message}`;
  }

  if (hasFailures) {
    healthStatus.status = "error";
    return res.status(503).json(healthStatus);
  }

  return res.json(healthStatus);
});

// Register Feature Routes
app.use("/api/auth", authRoutes);
app.use("/api/cameras", cameraRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/inference", inferenceRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/metrics", metricsRoutes);
app.use("/api/user", userRoutes);

// Serves built frontend statically in production
if (isProduction) {
  const frontendDist = path.join(__dirname, "..", "web", "dist");
  app.use(express.static(frontendDist));
  
  app.use((req, res, next) => {
    // Only serve index.html for GET requests that do not target API endpoints
    if (req.method !== "GET" || req.path.startsWith("/api")) {
      return next();
    }
    res.sendFile(path.join(frontendDist, "index.html"));
  });
}

// Global Exception Handler Middleware (JSON format)
app.use(errorHandler);

// Start Server
const server = app.listen(PORT, "0.0.0.0", () => {
  logger.info(`🚀 ITMS Backend Server running on http://localhost:${PORT} in ${process.env.NODE_ENV || "development"} mode`);
});

// Port lock handling
server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    logger.error(`❌ PORT ${PORT} is already in use. Terminating process.`);
    process.exit(1);
  } else {
    logger.error(`❌ Server error: ${err.message}`);
  }
});

// Graceful Shutdown
async function gracefulShutdown(signal) {
  logger.info(`🔌 Received ${signal}. Starting graceful shutdown...`);
  
  // 1. Close HTTP server
  server.close(() => {
    logger.info("🔌 Express HTTP server closed.");
    
    // 2. Disconnect DB
    closeDB().then(() => {
      logger.info("🔌 System shutdown complete. Exiting.");
      process.exit(0);
    });
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.warn("⚠️ Forced shutdown timeout exceeded. Terminating immediately.");
    process.exit(1);
  }, 10000);
}

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

process.on("uncaughtException", (err) => {
  logger.error("❌ UNCAUGHT EXCEPTION:", { message: err.message, stack: err.stack });
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("❌ UNHANDLED REJECTION at:", { promise, reason });
});
