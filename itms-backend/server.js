import dotenv from "dotenv";
import crypto from "node:crypto";
import { createReadStream, existsSync, mkdirSync, readdirSync, statSync, unlink } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import multer from "multer";
import passport from "passport";
import session from "express-session";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import cors from "cors";
import cookieParser from "cookie-parser";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { nanoid } from "nanoid";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataEnvPath = path.join(__dirname, "data", ".env");
dotenv.config();
if (existsSync(dataEnvPath)) {
  dotenv.config({ path: dataEnvPath, override: true });
}

// ==========================================
// MONGODB SCHEMAS & MODELS
// ==========================================
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ FATAL: MONGODB_URI is missing in .env");
  process.exit(1);
}

// Connection
mongoose.connect(MONGODB_URI).then(() => {
  const { host, name } = mongoose.connection;
  console.log(`🚀 Connected to MongoDB Atlas: ${host}/${name}`);
}).catch(err => {
  console.error("❌ MongoDB Connection Error:", err.message);
  process.exit(1);
});

// User Schema
// User Schema
const userSchema = new mongoose.Schema({
  id: { type: String, default: () => nanoid() },
  email: { type: String, required: true, unique: true },
  googleEmail: { type: String, default: "" },
  password: { type: String },
  name: { type: String },
  role: { type: String, enum: ["user", "operator"], default: "user" },
  profilePicture: { type: String },
  cloudinaryId: { type: String }, // To handle deletion
  linkedProviders: { type: [String], default: [] },
  googleId: { type: String },
  authProvider: { type: String },
  passwordSet: { type: Boolean },
  passwordResetToken: { type: String },
  passwordResetExpires: { type: Date }
}, { timestamps: true, id: false }); // Disable virtual id to avoid conflict
const User = mongoose.model("User", userSchema);

// Camera Schema
const cameraSchema = new mongoose.Schema({
  id: { type: String, default: () => nanoid() },
  name: { type: String, required: true },
  location: { type: String },
  status: { type: String, enum: ["Online", "Offline"], default: "Online" },
  coordinates: {
    lat: { type: Number, default: 0 },
    lng: { type: Number, default: 0 }
  },
  streamUrl: { type: String },
  stream: { type: String, default: "Auto" },
  type: { type: String, default: "Bullet" },
  lastActive: { type: Date, default: Date.now }
}, { timestamps: true, id: false });
const Camera = mongoose.model("Camera", cameraSchema);

// Inference Job Schema
const jobSchema = new mongoose.Schema({
  id: { type: String, default: () => nanoid() },
  type: { type: String, enum: ["congestion", "accident"], required: true },
  status: { type: String, enum: ["queued", "running", "completed", "failed"], default: "queued" },
  sourceType: { type: String },
  sourceId: { type: String },
  sourceLabel: { type: String },
  streamUrl: { type: String },
  threshold: { type: Number },
  result: { type: Object },
  error: { type: String },
  progress: { type: Number, default: 0 },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true, id: false });
const InferenceJob = mongoose.model("InferenceJob", jobSchema);

// Alert Schema
const alertSchema = new mongoose.Schema({
  id: { type: String, default: () => nanoid() },
  type: { type: String, required: true },
  severity: { type: String, default: "Medium" },
  locationStr: { type: String },
  cameraId: { type: String },
  message: { type: String },
  active: { type: Boolean, default: true },
  latitude: { type: Number },
  longitude: { type: Number },
  timestamp: { type: Date, default: Date.now },
  status: { type: String, enum: ["Active", "Acknowledged", "Resolved"], default: "Active" }
}, { timestamps: true, id: false });
const Alert = mongoose.model("Alert", alertSchema);

// Upload Schema
const uploadSchema = new mongoose.Schema({
  id: { type: String, default: () => nanoid() },
  originalName: { type: String },
  filename: { type: String },
  path: { type: String }, // Cloud URL
  cloudinaryId: { type: String },
  size: { type: Number },
  coordinates: {
    lat: { type: Number, default: 0 },
    lng: { type: Number, default: 0 }
  },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true, id: false });
const Upload = mongoose.model("Upload", uploadSchema);

// Settings Schema
const settingsSchema = new mongoose.Schema({
  id: { type: String, default: () => "global" },
  congestionThreshold: { type: Number, default: 10 },
  overlayEnabled: { type: Boolean, default: true }
}, { timestamps: true, id: false });
const Settings = mongoose.model("Settings", settingsSchema);

async function getSettings() {
  let s = await Settings.findOne();
  if (!s) s = await Settings.create({});
  return s;
}

// Simple Express server for user authentication with JWT and cookie support
const app = express();
// Configuration constants
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";
const isProduction = process.env.NODE_ENV === "production";
const SERVER_URL = process.env.SERVER_URL || `http://localhost:${PORT}`;
const GOOGLE_CALLBACK_URL =
  process.env.GOOGLE_CALLBACK_URL || `${SERVER_URL}/api/auth/google/callback`;
const MODEL_SERVICE_URL = process.env.MODEL_SERVICE_URL || "http://127.0.0.1:8001";
const MODEL_SERVICE_TIMEOUT_MS = Number(process.env.MODEL_SERVICE_TIMEOUT_MS || 90000);
const MODEL_SERVICE_STRICT = String(process.env.MODEL_SERVICE_STRICT || "false") === "true";
const MAX_UPLOAD_SIZE_MB = Number(process.env.MAX_UPLOAD_SIZE_MB || 300);
const SAMPLE_ITMS_II_DIR = path.resolve(__dirname, "..", "datasets", "Accident model");

/**
 * Service to handle emergency notifications.
 * Currently simulated for demonstration purposes.
 */
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});
// For password resets, we send a simple email with the reset link. In production, this should be a secure, single-use token link.
async function sendPasswordResetEmail(recipientEmail, resetLink) {
  if (!EMAIL_USER || !EMAIL_PASS) {
    console.log(`Password reset link for ${recipientEmail}: ${resetLink}`);
    return;
  }

  const mailOptions = {
    from: `"ITMS Security" <${EMAIL_USER}>`,
    to: recipientEmail,
    subject: "Reset your ITMS password",
    html: `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #d7dee8; border-radius: 8px;">
        <h2 style="color: #0f172a;">Reset your password</h2>
        <p>We received a request to reset the password for your ITMS account.</p>
        <p>
          <a href="${resetLink}" target="_blank" rel="noopener noreferrer"
            style="display: inline-block; padding: 10px 14px; border-radius: 6px; background: #0891b2; color: #ffffff; text-decoration: none;">
            Reset password
          </a>
        </p>
        <p>This link expires in 1 hour. If you did not request this, you can ignore this email.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

async function sendAccidentEmail(recipientEmail, accidentDetails) {
  if (!EMAIL_USER || !EMAIL_PASS) {
    console.log("Email service skip: Credentials missing in .env (EMAIL_USER/EMAIL_PASS)");
    return;
  }

  const lat = Number(accidentDetails?.latitude);
  const lng = Number(accidentDetails?.longitude);
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0);
  const mapsUrl = hasCoords ? `https://maps.google.com/?q=${lat},${lng}` : "";
  const locationDetailsHtml = hasCoords
    ? `
        <p><strong>Coordinates:</strong> ${lat.toFixed(6)}, ${lng.toFixed(6)}</p>
        <p><a href="${mapsUrl}" target="_blank" rel="noopener noreferrer">Open in Google Maps</a></p>
      `
    : "";
  
  const mailOptions = {
    from: `"ITMS Emergency Alerts" <${EMAIL_USER}>`,
    to: recipientEmail,
    subject: "🚨 URGENT: Traffic Accident Detected in Your City",
    html: `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #f44336; border-radius: 8px;">
        <h2 style="color: #f44336;">Emergency Traffic Alert</h2>
        <p>This is an automated safety alert from the <strong>Intelligent Traffic Management System (ITMS)</strong>.</p>
        <hr/>
        <p><strong>Incident:</strong> Accident detected with high confidence.</p>
        <p><strong>Location:</strong> ${accidentDetails.location}</p>
        ${locationDetailsHtml}
        <p><strong>Details:</strong> ${accidentDetails.message}</p>
        <hr/>
        <h3 style="color: #333;">Emergency Response Status:</h3>
        <ul>
          <li><strong>Police:</strong> Dispatched (ETA: ${accidentDetails.etas.police} min)</li>
          <li><strong>Medical:</strong> Dispatched (ETA: ${accidentDetails.etas.ambulance} min)</li>
          <li><strong>Fire Dept:</strong> Dispatched (ETA: ${accidentDetails.etas.fire} min)</li>
        </ul>
        <p style="font-size: 12px; color: #666; margin-top: 20px;">
          Please avoid this area to clear the way for emergency responders. 
          Drive safe, <br/>Dehradun ITMS Command Center
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email alert sent to: ${recipientEmail}`);
  } catch (error) {
    console.error(`Email delivery failed for ${recipientEmail}:`, error.message);
  }
}

class EmergencyDispatchService {
  /**
   * Orchestrates a multi-agency response and broadcasts alerts to all verified citizens.
   */
  async triggerFullResponse(locationStr, message, incidentGeo = {}) {
    const etas = {
      police: Math.floor(Math.random() * (5 - 2 + 1)) + 2,    // 2-5 mins
      ambulance: Math.floor(Math.random() * (7 - 4 + 1)) + 4, // 4-7 mins
      fire: Math.floor(Math.random() * (10 - 6 + 1)) + 6      // 6-10 mins
    };

    console.log("\n" + "=".repeat(50));
    console.log("🚑 MULTI-AGENCY EMERGENCY DISPATCH");
    console.log(`📍 LOCATION: ${locationStr}`);
    console.log(`📢 ALERT: ${message}`);
    console.log("--------------------------------------------------");

    // Broadcast to verified users
    const allUsers = await User.find();
    console.log(`🔍 DIAGNOSTIC: Total users in DB: ${allUsers.length}`);
    
    const googleLinkedUsers = allUsers.filter((u) => {
      const providers = Array.isArray(u.linkedProviders) ? u.linkedProviders : [];
      return providers.includes("google") || Boolean(u.googleId);
    });

    const recipients = [];
    for (const user of googleLinkedUsers) {
      const providers = Array.isArray(user.linkedProviders) ? user.linkedProviders : [];
      const normalizedGoogleEmail = String(user.googleEmail || "").trim().toLowerCase();

      // Primary route: explicit Google mailbox captured at OAuth time.
      let recipient = normalizedGoogleEmail;

      // Legacy fallback: older records may be Google-linked but missing googleEmail.
      // Use stored email to avoid dropping emergency alerts, then backfill googleEmail.
      if (!recipient) {
        const fallbackEmail = String(user.email || "").trim().toLowerCase();
        if (fallbackEmail) {
          recipient = fallbackEmail;
          user.googleEmail = fallbackEmail;
          if (!providers.includes("google")) user.linkedProviders = [...providers, "google"];
          user.save().catch((err) => {
            console.warn(`Google email backfill failed for user ${user.id}:`, err.message);
          });
        }
      }

      if (recipient) recipients.push(recipient);
    }

    if (recipients.length > 0) {
      console.log(`📡 BROADCAST: Found ${recipients.length} verified citizens. Sending alerts...`);
      const details = {
        location: locationStr,
        message,
        latitude: incidentGeo.latitude,
        longitude: incidentGeo.longitude,
        etas: {
          police: etas.police,
          ambulance: etas.ambulance,
          fire: etas.fire,
        }
      };
      
      // Send emails in parallel
      Promise.all(recipients.map((email) => sendAccidentEmail(email, details))).catch(err => {
        console.error("❌ BROADCAST ERROR:", err);
      });
    } else {
      console.log("📡 BROADCAST: Skip. Reason: No verified citizens found in database.");
    }

    console.log(`🚓 Police: Dispatched (ETA: ${etas.police}m)`);
    console.log(`🚑 Ambulance: Dispatched (ETA: ${etas.ambulance}m)`);
    console.log(`🚒 Fire Dept: Dispatched (ETA: ${etas.fire}m)`);
    console.log("=".repeat(50) + "\n");
    
    return etas;
  }
}
const SAMPLE_TRAFFIC_MONITOR_DIR = path.resolve(__dirname, "..", "datasets", "Congestion model");
const ALLOWED_ROLES = new Set(["user", "operator"]);

import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

// Configuration for Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Diagnostic check to see what folder structure exists
cloudinary.api.root_folders()
  .then(res => {
    const folders = res.folders?.map(f => f.name) || [];
    console.log("📁 CLOUDINARY FOUND FOLDERS:", folders);
    // If it has space folder but we use underscore, we might want to know
    if (folders.includes("itms datasets") && !folders.includes("itms_datasets")) {
      console.warn("⚠️  WARNING: Found 'itms datasets' (with space) but code expects 'itms_datasets' (underscore). Adjusting will happen in auto-heal.");
    }
  })
  .catch(err => console.warn("📁 Cloudinary folder scan fail:", err.message));

// Storage for profile pictures
const profilePicStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "itms_profiles",
    allowed_formats: ["jpg", "png", "jpeg"],
    public_id: (req, file) => `profile_${req.userId || nanoid()}`,
  },
});
const uploadProfilePic = multer({ storage: profilePicStorage });

// Storage for uploaded videos
const videoUploadStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "itms_uploads",
    resource_type: "video",
    public_id: (req, file) => `video_${Date.now()}_${nanoid(6)}`,
  },
});
const uploadVideo = multer({
  storage: videoUploadStorage,
  limits: { fileSize: MAX_UPLOAD_SIZE_MB * 1024 * 1024 },
});
// Middleware setup
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
// Helper functions for authentication and user management
const TOKEN_COOKIE = "itms_token";
const TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
function normalizeRole(value) {
  const role = String(value || "").trim().toLowerCase();
  if (role === "operator") return "operator";
  return "user";
}
function inferLegacyRole(user, index = 0) {
  const existing = String(user?.role || "").trim().toLowerCase();
  if (existing === "operator" || existing === "user") {
    return existing;
  }
  const org = String(user?.organization || "").trim().toLowerCase();
  if (org && org !== "individual") {
    return "operator";
  }
  if (index === 0) {
    return "operator";
  }
  return "user";
}
// Remove sensitive fields from user object before sending to client
const signToken = (user) => {
  return jwt.sign({ sub: user.id, email: user.email, role: user.role }, JWT_SECRET, {
    expiresIn: "7d",
  });
};
const setAuthCookie = (res, token) => {
  res.cookie(TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: TOKEN_MAX_AGE_MS,
  });
};
const sanitizeUser = (u) => {
  if (!u) return null;
  return {
    id: u.id,
    email: u.email,
    fullName: u.name,
    role: u.role,
    profilePic: u.profilePicture,
    linkedProviders: u.linkedProviders,
    createdAt: u.createdAt
  };
};
function ensureAuthMetadata(user) {
  let changed = false;
  const normalizedRole = normalizeRole(user.role || inferLegacyRole(user));
  if (user.role !== normalizedRole) {
    user.role = normalizedRole;
    changed = true;
  }
  if (!user.authProvider) {
    user.authProvider = user.oauthProvider === "google" ? "google" : "password";
    changed = true;
  }
  if (!Array.isArray(user.linkedProviders)) {
    user.linkedProviders = [];
    changed = true;
  }
  if (user.authProvider && !user.linkedProviders.includes(user.authProvider)) {
    user.linkedProviders.push(user.authProvider);
    changed = true;
  }
  if (typeof user.passwordSet !== "boolean") {
    if (user.authProvider === "google") {
      user.passwordSet = false;
    } else {
      user.passwordSet = Boolean(user.passwordHash);
    }
    changed = true;
  }
  return changed;
}
function canUsePasswordLogin(user) {
  if (user.passwordSet === true) return true;
  return user.authProvider === "password";
}
function decodeOauthState(state) {
  if (!state) return null;
  try {
    const payload = jwt.verify(String(state), JWT_SECRET);
    if (!payload || typeof payload !== "object") return null;
    return {
      mode: ["signup", "link"].includes(payload.mode) ? payload.mode : "login",
      role: typeof payload.role === "string" ? payload.role : undefined,
      organization: typeof payload.organization === "string" ? payload.organization : undefined,
      linkUserId: typeof payload.linkUserId === "string" ? payload.linkUserId : undefined,
    };
  } catch {
    return null;
  }
}
async function linkGoogleProvider(userId, googleData) {
  const user = await User.findOne({ id: userId });
  if (!user) throw new Error("User not found during linking.");
  
  // Merge if ID exists elsewhere
  const otherUser = await User.findOne({ googleId: googleData.oauthId, id: { $ne: userId } });
  if (otherUser) {
    console.log(`♻️ MERGE: Moving Google ID ${googleData.oauthId} from ${otherUser.email} to ${user.email}`);
    otherUser.googleId = null;
    otherUser.googleEmail = "";
    otherUser.linkedProviders = (otherUser.linkedProviders || []).filter(p => p !== "google");
    await otherUser.save();
  }

  user.googleId = googleData.oauthId;
  user.googleEmail = googleData.email || user.googleEmail || "";
  if (!user.linkedProviders.includes("google")) {
    user.linkedProviders.push("google");
  }
  await user.save();
  return user;
}

function getGoogleProfile(profile) {
  const email = profile?.emails?.[0]?.value ? String(profile.emails[0].value).trim().toLowerCase() : "";
  const fullName = profile?.displayName || [profile?.name?.givenName, profile?.name?.familyName].filter(Boolean).join(" ") || "";
  const profilePic = profile?.photos?.[0]?.value ? String(profile.photos[0].value) : "";
  const oauthId = profile?.id ? String(profile.id) : "";
  return { email, fullName, profilePic, oauthId };
}

async function upsertGoogleUser({ email, fullName, profilePic, role, organization, oauthId }) {
  let user = await User.findOne({ email });
  if (user) {
    let changed = false;
    if (profilePic && !user.profilePicture) {
      user.profilePicture = profilePic;
      changed = true;
    }
    if (fullName && (!user.name || user.name === "Unknown")) {
      user.name = fullName;
      changed = true;
    }
    if (oauthId && !user.googleId) {
      user.googleId = oauthId;
      changed = true;
    }
    if (email && user.googleEmail !== email) {
      user.googleEmail = email;
      changed = true;
    }
    if (!user.linkedProviders.includes("google")) {
      user.linkedProviders.push("google");
      changed = true;
    }
    if (changed) await user.save();
    return user;
  }

  const normalizedRole = ALLOWED_ROLES.has(String(role || "").toLowerCase()) ? String(role || "").toLowerCase() : "user";
  const passwordHash = await bcrypt.hash(nanoid(), 10);

  user = await User.create({
    email,
    googleEmail: email,
    name: fullName || email.split("@")[0] || "User",
    password: passwordHash,
    role: normalizedRole,
    profilePicture: profilePic || "",
    googleId: oauthId || "",
    linkedProviders: ["google"]
  });
  return user;
}

// Extract the token from cookies or Authorization header
function getToken(req) {
  const cookieToken = req.cookies?.[TOKEN_COOKIE];
  if (cookieToken) return cookieToken;
  const header = req.headers.authorization;
  if (!header) return null;
  const [type, value] = header.split(" ");
  if (type !== "Bearer") return null;
  return value || null;
}

// Middleware to protect routes that require authentication
function requireAuth(req, res, next) {
  const token = getToken(req);
  if (!token) return res.status(401).json({ message: "Unauthorized" });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.sub;
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}

async function requireOperator(req, res, next) {
  const user = await User.findOne({ id: req.userId });
  if (!user) return res.status(404).json({ message: "User not found." });
  
  if (user.role !== "operator") {
    return res.status(403).json({ message: "Operator access required.", role: user.role });
  }
  req.currentUser = user;
  return next();
}
function formatRelativeTime(isoString) {
  const ts = new Date(isoString).getTime();
  if (!Number.isFinite(ts)) return "Unknown";
  const delta = Math.max(0, Date.now() - ts);
  const sec = Math.floor(delta / 1000);
  if (sec < 60) return "Just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const days = Math.floor(hr / 24);
  return `${days}d ago`;
}
function mapCameraResponse(camera) {
  const rawUrl = String(camera.streamUrl || "");
  const isLocalFile = /^[a-zA-Z]:\\|^\//.test(rawUrl);
  const previewUrl = isLocalFile
    ? `/api/media/camera/${camera.id}`
    : /^https?:\/\//i.test(rawUrl) || /^data:/i.test(rawUrl)
      ? rawUrl
      : "";
  return {
    id: camera.id,
    name: camera.name,
    url: camera.streamUrl,
    stream: camera.stream,
    status: camera.status,
    lastPing: formatRelativeTime(camera.lastActive || camera.updatedAt || camera.createdAt),
    lastPingAt: camera.lastActive || camera.updatedAt || camera.createdAt,
    createdAt: camera.createdAt,
    updatedAt: camera.updatedAt,
    latitude: camera.coordinates?.lat ?? null,
    longitude: camera.coordinates?.lng ?? null,
    modelHint: camera.type || "",
    previewUrl,
  };
}
const SERVER_START_TIME = Date.now();
let CLOUDINARY_SAMPLES_CACHE = [];

async function refreshCloudinarySamples() {
  try {
    const result = await cloudinary.search
      .expression("resource_type:video AND (public_id:Cam* OR folder:itms_datasets)")
      .max_results(30)
      .execute();

    if (result.resources && result.resources.length > 0) {
      CLOUDINARY_SAMPLES_CACHE = result.resources.map(r => ({
        id: `sample:${r.public_id.split('/').pop()}`,
        name: r.public_id.split('/').pop(),
        modelType: r.public_id.toLowerCase().includes("congestion") ? "congestion" : "accident",
        publicId: r.public_id,
        path: r.secure_url + `?cb=${SERVER_START_TIME}`,
        source: "Search"
      }));
      console.log(`🔍 CLOUDINARY SEARCH: Found ${CLOUDINARY_SAMPLES_CACHE.length} potential samples.`);
    }
  } catch (err) {
    console.warn("🔍 Cloudinary search failed:", err.message);
  }
}

// Initial scan
refreshCloudinarySamples();

function getSampleVideos() {
  const now = SERVER_START_TIME;
  
  const baseVideos = [
    { id: "congestion:Cam1", name: "Intersection 1", modelType: "congestion", publicId: "itms_datasets/Cam1" },
    { id: "congestion:Cam2", name: "Intersection 2", modelType: "congestion", publicId: "itms_datasets/Cam2" },
    { id: "congestion:Cam3", name: "Intersection 3", modelType: "congestion", publicId: "itms_datasets/Cam3" },
    { id: "congestion:Cam4", name: "Intersection 4", modelType: "congestion", publicId: "itms_datasets/Cam4" },
    { id: "congestion:Cam5", name: "Intersection 5", modelType: "congestion", publicId: "itms_datasets/Cam5" },
    { id: "accident:Cam6", name: "CCTV Stream 1", modelType: "accident", publicId: "itms_datasets/Cam6" },
    { id: "accident:Cam7", name: "CCTV Stream 2", modelType: "accident", publicId: "itms_datasets/Cam7" },
    { id: "accident:Cam8", name: "Incident Feed 2", modelType: "accident", publicId: "itms_datasets/Cam8" },
    { id: "accident:Cam9", name: "Incident Feed 3", modelType: "accident", publicId: "itms_datasets/Cam9" }
  ];

  const videos = baseVideos.map(v => {
    // We look for a "Real" cloud file that starts with this Cam# (e.g. Cam4_bqfziv)
    const shortName = v.publicId.split('/').pop(); // "Cam1"
    const realMatch = CLOUDINARY_SAMPLES_CACHE.find(c => c.name.startsWith(shortName));

    // If search found a real file, use its secure URL but KEEP THE PRETTY NAME from baseVideos
    if (realMatch) {
      return { 
        ...v, 
        path: realMatch.path, 
        source: "CloudSearch" 
      };
    }

    // Fallback: Use standard SDK URL generation
    const rawPath = cloudinary.url(v.publicId, {
      resource_type: "video", secure: true, version: "1", format: "mp4"
    });
    const cleanRawPath = rawPath.split("?")[0];
    return { ...v, path: `${cleanRawPath}?cb=${now}`, source: "StaticFallback" };
  });

  if (videos.length > 0) {
    console.log(`🎬 LOADED ${videos.length} samples. [Cam1]: ${videos[0].path}`);
  }
  return { videos, scanned: ["Cloudinary/Search"] };
}

function buildInferenceResult(type, threshold) {
  if (type === "congestion") {
    const vehicleCount = 8 + Math.floor(Math.random() * 35);
    const avgSpeed = Number((1.5 + Math.random() * 6.5).toFixed(1));
    const base = Math.min(100, Math.max(0, vehicleCount * 2 + Math.floor((7 - avgSpeed) * 8)));
    const index = Math.max(0, Math.min(100, Math.round((base + threshold) / 2)));
    const congestionLevel =
      index >= 75 ? "High" : index >= 50 ? "Moderate" : index >= 30 ? "Low" : "Clear";
    return {
      vehicleCount,
      avgSpeed,
      index,
      congestionLevel,
    };
  }
  const incidentsDetected = Math.random() > 0.7 ? 1 : 0;
  const confidence = incidentsDetected
    ? Number((0.78 + Math.random() * 0.2).toFixed(2))
    : Number((0.35 + Math.random() * 0.35).toFixed(2));
  return {
    incidentsDetected,
    confidence,
    responseEta: incidentsDetected ? `${5 + Math.floor(Math.random() * 8)} min` : "--",
  };
}
async function callModelService({ type, sourceType, source, threshold }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), MODEL_SERVICE_TIMEOUT_MS);
  try {
    const response = await fetch(`${MODEL_SERVICE_URL}/infer/${type}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source_type: sourceType,
        source,
        threshold,
      }),
      signal: controller.signal,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = data?.detail || `Model service failed (${response.status})`;
      throw new Error(message);
    }
    if (!data?.result || typeof data.result !== "object") {
      throw new Error("Model service returned an invalid response.");
    }
    return {
      result: data.result,
      provider: data?.provider || "model-service",
      serviceStatus: data?.status || "ok",
    };
  } finally {
    clearTimeout(timeout);
  }
}
async function addAlertsFromResult(job, result) {
  const sourceId = job.sourceId || job.fileId || "";
  
  // Deactivate older alerts for this specific source and type
  await Alert.updateMany({ cameraId: sourceId, type: job.type }, { active: false });

  const camera = await Camera.findOne({ id: sourceId });
  const upload = await Upload.findOne({ id: sourceId });
  const lat = camera?.coordinates?.lat ?? upload?.coordinates?.lat ?? 0;
  const lng = camera?.coordinates?.lng ?? upload?.coordinates?.lng ?? 0;

  if (job.type === "congestion") {
    const isActive = Number(result.vehicleCount || 0) >= Number(job.threshold || 0);
    if (isActive) {
      await Alert.create({
        type: "congestion",
        severity: result.index >= 80 ? "High" : result.index >= 60 ? "Medium" : "Low",
        message: `Congestion ${result.congestionLevel} on ${job.sourceLabel || "unknown source"}`,
        active: true,
        cameraId: sourceId,
        locationStr: job.sourceLabel,
        latitude: lat,
        longitude: lng
      });
    }
  } else if (job.type === "accident" && Number(result.incidentsDetected) > 0) {
    const alertMsg = `Accident detected (${Math.round(result.confidence * 100)}% confidence) on ${job.sourceLabel || "unknown"}`;
    
    // Dispatch
    const dispatcher = new EmergencyDispatchService();
    const agencyETAs = await dispatcher.triggerFullResponse(
      job.sourceLabel || "Unknown Location",
      alertMsg,
      { latitude: lat, longitude: lng }
    );

    await Alert.create({
      type: "accident",
      severity: result.confidence >= 0.9 ? "Critical" : "High",
      message: alertMsg,
      active: true,
      cameraId: sourceId,
      locationStr: job.sourceLabel,
      latitude: lat,
      longitude: lng
    });
  }
}

async function processInferenceJob(jobId) {
  const job = await InferenceJob.findOne({ id: jobId });
  if (!job) return;

  job.status = "running";
  job.progress = 5;
  await job.save();

  // Simulated progress timer to keep user engaged while blocking model call runs
  let currentProgress = 5;
  const progressTimer = setInterval(async () => {
    if (currentProgress < 90) {
      currentProgress += Math.floor(Math.random() * 8) + 2;
      job.progress = currentProgress; // Sync in-memory object
      await InferenceJob.updateOne({ id: jobId }, { progress: currentProgress });
    }
  }, 1500);

  let result = null;
  let provider = "mock-fallback";
  try {
    const serviceOutput = await callModelService({
      type: job.type,
      sourceType: job.sourceType,
      source: job.streamUrl,
      threshold: job.threshold,
    });
    result = serviceOutput.result;
    provider = serviceOutput.provider;
  } catch (err) {
    console.error(`❌ INFERENCE FAILED [${jobId}]:`, err.message);
    if (MODEL_SERVICE_STRICT) {
      clearInterval(progressTimer);
      job.status = "failed";
      job.error = err.message || "Model service unavailable.";
      job.progress = 0;
      await job.save();
      return;
    }
    result = buildInferenceResult(job.type, job.threshold);
    provider = "mock-fallback";
  } finally {
    clearInterval(progressTimer);
  }

  job.status = "completed";
  job.result = result;
  job.progress = 100;
  await job.save();
  await addAlertsFromResult(job, result);
}
function streamLocalVideo(req, res, absPath) {
  if (!absPath || !existsSync(absPath)) {
    return res.status(404).json({ message: "Video file not found." });
  }
  const stat = statSync(absPath);
  const fileSize = stat.size;
  const range = req.headers.range;
  const ext = path.extname(absPath).toLowerCase();
  const contentType =
    ext === ".webm"
      ? "video/webm"
      : ext === ".mkv"
        ? "video/x-matroska"
        : ext === ".avi"
          ? "video/x-msvideo"
          : ext === ".mov"
            ? "video/quicktime"
            : "video/mp4";

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = Number(parts[0]);
    const end = parts[1] ? Number(parts[1]) : fileSize - 1;
    if (!Number.isFinite(start) || !Number.isFinite(end) || start > end || end >= fileSize) {
      return res.status(416).send("Requested Range Not Satisfiable");
    }
    const chunkSize = end - start + 1;
    const file = createReadStream(absPath, { start, end });
    res.writeHead(206, {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunkSize,
      "Content-Type": contentType,
      "Cache-Control": "no-store",
    });
    file.pipe(res);
    return;
  }

  res.writeHead(200, {
    "Content-Length": fileSize,
    "Content-Type": contentType,
    "Accept-Ranges": "bytes",
    "Cache-Control": "no-store",
  });
  createReadStream(absPath).pipe(res);
}
// API routes for health check and authentication (endpoints for signup, login, logout, and fetching current user)
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});
// User registration endpoint with validation and password hashing using bcrypt before storing in the database
app.post("/api/auth/signup", async (req, res) => {
  const { fullName, email, password, role } = req.body || {};
  const normalizedRole = ALLOWED_ROLES.has(String(role || "").toLowerCase()) ? String(role || "").toLowerCase() : "user";
  if (!fullName || !email || !password) return res.status(400).json({ message: "All fields are required." });
  if (password.length < 8) return res.status(400).json({ message: "Password must be at least 8 characters." });

  const normalizedEmail = String(email).trim().toLowerCase();
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) return res.status(409).json({ message: "Account already exists for this email." });

  const passwordHash = await bcrypt.hash(password, 10);
  const newUser = await User.create({
    email: normalizedEmail,
    name: String(fullName).trim(),
    password: passwordHash,
    role: normalizedRole,
    linkedProviders: ["password"]
  });

  const token = signToken(newUser);
  setAuthCookie(res, token);
  return res.status(201).json({ user: sanitizeUser(newUser) });
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ message: "Email and password are required." });

  const normalizedEmail = String(email).trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });
  if (!user) return res.status(401).json({ message: "Invalid email or password." });
  
  if (!user.password) return res.status(401).json({ message: "Use Google login for this account." });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ message: "Invalid email or password." });

  const token = signToken(user);
  setAuthCookie(res, token);
  return res.json({ user: sanitizeUser(user) });
});
// Endpoint to handle password reset requests, generating a secure token and sending a reset link via email. The token is hashed and stored in the database with an expiration time for security.
app.post("/api/auth/forgot-password", async (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ message: "Email is required." });

  const normalizedEmail = String(email).trim().toLowerCase();
  const genericMessage = "If an account exists for this email, a password reset link has been sent.";
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    return res.json({ message: genericMessage });
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  user.passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
  await user.save();

  const resetLink = `${CLIENT_ORIGIN.replace(/\/$/, "")}/reset-password/${resetToken}`;

  try {
    await sendPasswordResetEmail(user.email, resetLink);
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    console.error("Password reset email failed:", err.message);
    return res.status(500).json({ message: "Could not send password reset email. Please try again later." });
  }

  const response = { message: genericMessage };
  if (!isProduction && (!EMAIL_USER || !EMAIL_PASS)) {
    response.resetLink = resetLink;
  }
  return res.json(response);
});

app.post("/api/auth/reset-password", async (req, res) => {
  const { token, password, newPassword } = req.body || {};
  const nextPassword = String(newPassword || password || "");

  if (!token) return res.status(400).json({ message: "Reset token is required." });
  if (!nextPassword) return res.status(400).json({ message: "New password is required." });
  if (nextPassword.length < 8) return res.status(400).json({ message: "Password must be at least 8 characters." });

  const hashedToken = crypto.createHash("sha256").update(String(token)).digest("hex");
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: new Date() },
  });

  if (!user) {
    return res.status(400).json({ message: "Password reset link is invalid or has expired." });
  }

  user.password = await bcrypt.hash(nextPassword, 10);
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.passwordSet = true;
  if (!Array.isArray(user.linkedProviders)) user.linkedProviders = [];
  if (!user.linkedProviders.includes("password")) user.linkedProviders.push("password");
  if (!user.authProvider) user.authProvider = "password";

  await user.save();
  return res.json({ message: "Password reset successfully.", user: sanitizeUser(user) });
});

app.post("/api/auth/logout", (req, res) => {
  res.clearCookie(TOKEN_COOKIE, { path: "/" });
  return res.json({ message: "Logged out" });
});

app.get("/api/auth/me", requireAuth, async (req, res) => {
  const user = await User.findOne({ id: req.userId });
  if (!user) return res.status(404).json({ message: "User not found" });
  return res.json({ user: sanitizeUser(user) });
});

app.post("/api/auth/bootstrap-operator", requireAuth, async (req, res) => {
  const user = await User.findOne({ id: req.userId });
  if (!user) return res.status(404).json({ message: "User not found." });
  if (isProduction && process.env.ALLOW_OPERATOR_BOOTSTRAP !== "true") {
    return res.status(403).json({ message: "Bootstrap is disabled in production." });
  }
  user.role = "operator";
  await user.save();
  return res.json({ message: "Upgraded to operator", user: sanitizeUser(user) });
});
if (isProduction) {
  app.set("trust proxy", 1);
}


app.post("/api/user/update-profile-pic", requireAuth, uploadProfilePic.single("image"), async (req, res) => {
  const user = await User.findOne({ id: req.userId });
  if (!user) return res.status(404).json({ message: "User not found" });

  // If there's an old image, delete it from Cloudinary
  if (user.cloudinaryId) {
    await cloudinary.uploader.destroy(user.cloudinaryId).catch(err => console.warn("Old pic delete fail:", err));
  }

  // Update with new image info
  user.profilePicture = req.file?.path || req.body.imageUrl;
  user.cloudinaryId = req.file?.filename || null;
  await user.save();

  return res.json({ message: "Profile picture updated", user: sanitizeUser(user) });
});

// Delete user account
app.delete("/api/user", requireAuth, async (req, res) => {
  const result = await User.deleteOne({ id: req.userId });
  if (result.deletedCount === 0) return res.status(404).json({ message: "User not found" });

  res.clearCookie(TOKEN_COOKIE, { path: "/" });
  return res.json({ message: "Account deleted" });
});

// Update profile details
app.put("/api/user", requireAuth, async (req, res) => {
  const { fullName, email, oldPassword, newPassword } = req.body || {};
  const user = await User.findOne({ id: req.userId });
  if (!user) return res.status(404).json({ message: "User not found." });

  if (email) {
    const normalizedEmail = String(email).trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail, id: { $ne: user.id } });
    if (existing) return res.status(409).json({ message: "Email is already in use." });
    user.email = normalizedEmail;
  }
  if (fullName) user.name = String(fullName).trim();

  if (newPassword) {
    if (String(newPassword).length < 8) return res.status(400).json({ message: "Password must be at least 8 characters." });
    const needsOldPassword = user.password && user.password.length > 20;
    if (needsOldPassword) {
      if (!oldPassword) return res.status(400).json({ message: "Old password is required." });
      const valid = await bcrypt.compare(String(oldPassword), user.password);
      if (!valid) return res.status(401).json({ message: "Old password is incorrect." });
    }
    user.password = await bcrypt.hash(String(newPassword), 10);
    if (!user.linkedProviders.includes("password")) user.linkedProviders.push("password");
  }

  await user.save();
  return res.json({ user: sanitizeUser(user) });
});

// Operator camera management
// Camera management
app.get("/api/cameras", requireAuth, async (req, res) => {
  const cameras = await Camera.find().sort({ lastActive: -1 });
  return res.json({ cameras: cameras.map(mapCameraResponse) });
});

app.post("/api/cameras", requireAuth, requireOperator, async (req, res) => {
  const { name, url, stream, status, latitude, longitude, modelHint } = req.body || {};
  if (!name || !url) return res.status(400).json({ message: "Name and stream URL are required." });

  const camera = await Camera.create({
    name: String(name).trim(),
    streamUrl: String(url).trim(),
    stream: String(stream || "Auto").trim(),
    status: String(status || "Online").trim(),
    coordinates: {
      lat: Number(latitude) || 0,
      lng: Number(longitude) || 0
    },
    type: String(modelHint || "Bullet").trim()
  });

  return res.status(201).json({ camera: mapCameraResponse(camera) });
});
app.put("/api/cameras/:id", requireAuth, requireOperator, async (req, res) => {
  const camera = await Camera.findOne({ id: req.params.id });
  if (!camera) return res.status(404).json({ message: "Camera not found." });

  const { name, url, stream, status, latitude, longitude, modelHint } = req.body || {};
  if (name) camera.name = String(name).trim();
  if (url) camera.streamUrl = String(url).trim();
  if (stream) camera.stream = String(stream).trim();
  if (status) camera.status = String(status).trim();
  if (latitude !== undefined) camera.coordinates.lat = Number(latitude) || 0;
  if (longitude !== undefined) camera.coordinates.lng = Number(longitude) || 0;
  if (modelHint) camera.type = String(modelHint).trim();

  await camera.save();
  return res.json({ camera: mapCameraResponse(camera) });
});

app.delete("/api/cameras/:id", requireAuth, requireOperator, async (req, res) => {
  const result = await Camera.deleteOne({ id: req.params.id });
  if (result.deletedCount === 0) return res.status(404).json({ message: "Camera not found." });
  return res.json({ message: "Camera deleted." });
});

// Operator settings
app.get("/api/settings", requireAuth, async (req, res) => {
  const settings = await getSettings();
  return res.json({ settings });
});

app.put("/api/settings/congestion-threshold", requireAuth, requireOperator, async (req, res) => {
  const value = Number(req.body?.value);
  if (!Number.isFinite(value) || value < 0 || value > 100) {
    return res.status(400).json({ message: "Threshold must be a number between 0 and 100." });
  }
  const settings = await getSettings();
  settings.congestionThreshold = Math.round(value);
  await settings.save();
  return res.json({ settings });
});

// Local sample videos from model folders
app.get("/api/samples/videos", requireAuth, async (req, res) => {
  const sampleData = getSampleVideos();
  return res.json({
    videos: sampleData.videos,
    scanned: sampleData.scanned,
  });
});
app.post("/api/cameras/import-sample", requireAuth, requireOperator, async (req, res) => {
  const sampleId = String(req.body?.sampleId || "");
  const latitude = req.body?.latitude;
  const longitude = req.body?.longitude;
  if (!sampleId) return res.status(400).json({ message: "sampleId is required." });

  const sample = getSampleVideos().videos.find((entry) => entry.id === sampleId);
  if (!sample) return res.status(404).json({ message: "Sample video not found." });

  const camera = await Camera.create({
    name: `Sample - ${sample.name}`,
    streamUrl: sample.path,
    stream: "FILE",
    status: "Online",
    coordinates: {
      lat: Number(latitude) || 30.3165,
      lng: Number(longitude) || 78.0322
    },
    type: sample.modelType
  });

  return res.status(201).json({ camera: mapCameraResponse(camera) });
});

app.post("/api/cameras/import-upload", requireAuth, requireOperator, async (req, res) => {
  const uploadId = String(req.body?.uploadId || "");
  if (!uploadId) return res.status(400).json({ message: "uploadId is required." });

  const record = await Upload.findOne({ id: uploadId });
  if (!record) return res.status(404).json({ message: "Upload not found." });

  const camera = await Camera.create({
    name: `Deployed: ${record.originalName}`,
    streamUrl: record.path,
    stream: "FILE",
    status: "Online",
    coordinates: {
      lat: record.coordinates.lat || 30.3165,
      lng: record.coordinates.lng || 78.0322
    },
    type: "Bullet"
  });

  return res.status(201).json({ camera: mapCameraResponse(camera) });
});

// Uploaded videos
app.get("/api/uploads", requireAuth, async (req, res) => {
  const uploads = await Upload.find().sort({ timestamp: -1 });
  return res.json({
    uploads: uploads.map(u => ({
      id: u.id,
      originalName: u.originalName,
      filename: u.filename,
      size: u.size,
      createdAt: u.timestamp,
      latitude: u.coordinates.lat,
      longitude: u.coordinates.lng,
      previewUrl: `/api/media/upload/${u.id}`,
    }))
  });
});

app.post("/api/uploads/video", requireAuth, requireOperator, (req, res) => {
  uploadVideo.single("video")(req, res, async (err) => {
    if (err) return res.status(400).json({ message: err.message || "Upload failed." });
    if (!req.file) return res.status(400).json({ message: "No video file uploaded." });

    const record = await Upload.create({
      originalName: req.file.originalname,
      filename: req.file.filename,
      path: req.file.path, // Cloudinary URL
      cloudinaryId: req.file.filename,
      size: req.file.size
    });

    return res.status(201).json({
      upload: {
        id: record.id,
        originalName: record.originalName,
        filename: record.filename,
        size: record.size,
        createdAt: record.timestamp,
        latitude: record.coordinates.lat,
        longitude: record.coordinates.lng,
        previewUrl: record.path, // Direct cloud link
      },
    });
  });
});

app.put("/api/uploads/:id/coordinates", requireAuth, requireOperator, async (req, res) => {
  const upload = await Upload.findOne({ id: req.params.id });
  if (!upload) return res.status(404).json({ message: "Uploaded video not found." });

  const { latitude, longitude } = req.body || {};
  if (latitude !== undefined) upload.coordinates.lat = Number(latitude);
  if (longitude !== undefined) upload.coordinates.lng = Number(longitude);

  await upload.save();
  return res.json({
    upload: {
      id: upload.id,
      latitude: upload.coordinates.lat,
      longitude: upload.coordinates.lng,
      previewUrl: `/api/media/upload/${upload.id}`,
    },
  });
});

app.get("/api/media/upload/:id", requireAuth, async (req, res) => {
  const upload = await Upload.findOne({ id: req.params.id });
  if (!upload) {
    console.error(`❌ MEDIA ERROR: Upload not found for ID: ${req.params.id}`);
    return res.status(404).json({ message: "Uploaded video not found." });
  }
  
  // If it's a Cloudinary link, redirect for direct browser playback
  if (upload.path && /^https?:\/\//i.test(upload.path)) {
    console.log(`📡 MEDIA REDIRECT: Redirecting to Cloudinary for upload ${upload.id}`);
    return res.redirect(upload.path);
  }
  
  console.log(`📂 MEDIA STREAM: Streaming local file for upload ${upload.id}`);
  return streamLocalVideo(req, res, upload.path);
});

app.delete("/api/uploads/:id", requireAuth, requireOperator, async (req, res) => {
  const upload = await Upload.findOne({ id: req.params.id });
  if (!upload) return res.status(404).json({ message: "Uploaded video not found." });

  // Delete from Cloudinary if it exists
  if (upload.cloudinaryId) {
    await cloudinary.uploader.destroy(upload.cloudinaryId, { resource_type: "video" })
      .catch(err => console.warn("Cloud video delete fail:", err));
  } else if (upload.path && existsSync(upload.path)) {
    // Fallback for legacy local files
    unlink(upload.path, (err) => {
      if (err) console.warn("Could not delete legacy file:", err.message);
    });
  }

  await Upload.deleteOne({ id: req.params.id });
  return res.json({ message: "Upload deleted." });
});

app.get("/api/media/camera/:id", requireAuth, async (req, res) => {
  const camera = await Camera.findOne({ id: req.params.id });
  if (!camera) return res.status(404).json({ message: "Camera not found." });

  const rawUrl = String(camera.streamUrl || "");
  const isLocalFile = /^[a-zA-Z]:\\|^\//.test(rawUrl);
  if (!isLocalFile) return res.status(400).json({ message: "This camera source is not a local file." });
  return streamLocalVideo(req, res, rawUrl);
});

// Inference job skeleton
app.post("/api/inference/jobs", requireAuth, requireOperator, async (req, res) => {
  const { type, sourceType, sourceId, fileId, threshold } = req.body || {};
  if (!["accident", "congestion"].includes(type)) return res.status(400).json({ message: "Invalid type." });
  
  let sourceLabel = "Unknown";
  let streamUrl = "";

  if (sourceType === "camera") {
    const cam = await Camera.findOne({ id: sourceId });
    if (!cam) return res.status(404).json({ message: "Camera not found." });
    sourceLabel = cam.name;
    streamUrl = cam.streamUrl;
  } else if (sourceType === "upload") {
    const up = await Upload.findOne({ id: fileId });
    if (!up) return res.status(404).json({ message: "File not found." });
    sourceLabel = up.originalName;
    streamUrl = up.path;
  } else {
    return res.status(400).json({ message: "Invalid source type." });
  }

  const settings = await getSettings();
  const job = await InferenceJob.create({
    type,
    sourceType,
    sourceId: sourceId || null,
    sourceLabel,
    streamUrl,
    threshold: Number(threshold) || settings.congestionThreshold
  });

  processInferenceJob(job.id).catch(async (err) => {
    await InferenceJob.updateOne({ id: job.id }, { 
      status: "failed", 
      error: err.message || "Background worker failed." 
    });
  });

  return res.status(202).json({ job });
});

app.get("/api/inference/jobs", requireAuth, async (req, res) => {
  const { type, limit = 25 } = req.query;
  const filter = type ? { type } : {};
  const jobs = await InferenceJob.find(filter).sort({ timestamp: -1 }).limit(Number(limit));
  return res.json({ jobs });
});

app.delete("/api/inference/jobs", requireAuth, requireOperator, async (req, res) => {
  await InferenceJob.deleteMany({});
  await Alert.deleteMany({});
  return res.json({ message: "All inference data cleared." });
});

app.get("/api/inference/jobs/:id", requireAuth, async (req, res) => {
  const job = await InferenceJob.findOne({ id: req.params.id });
  if (!job) return res.status(404).json({ message: "Job not found." });
  return res.json({ job });
});

// Alerts and metrics
app.get("/api/alerts", requireAuth, async (req, res) => {
  const { active, type } = req.query;
  const filter = {};
  if (active === "true") filter.active = true;
  if (type) filter.type = type;

  const alerts = await Alert.find(filter).sort({ timestamp: -1 }).limit(100);
  return res.json({ alerts });
});

app.get("/api/metrics/summary", requireAuth, async (req, res) => {
  const activeAlerts = await Alert.find({ active: true });
  const accidents = activeAlerts.filter(a => String(a.type).toLowerCase() === "accident").length;
  const congestion = activeAlerts.filter(a => String(a.type).toLowerCase() === "congestion").length;
  
  return res.json({
    metrics: {
      accidents,
      congestion,
      alerts: activeAlerts.length
    }
  });
});
app.get("/api/metrics/congestion-trend", requireAuth, async (req, res) => {
  const hours = Number(req.query.hours || 12);
  const safeHours = Math.min(48, Math.max(1, hours));
  const since = new Date(Date.now() - safeHours * 60 * 60 * 1000);
  
  const jobs = await InferenceJob.find({
    type: "congestion",
    status: "completed",
    timestamp: { $gte: since }
  }).sort({ timestamp: -1 }).limit(50);

  const points = jobs
    .reverse()
    .map(j => Number(j.result?.vehicleCount ?? j.result?.index))
    .filter(val => Number.isFinite(val));

  return res.json({ points, hasRealData: points.length > 0 });
});


// Set up session middleware for Passport to manage user sessions, and configure Passport to use the Google OAuth 2.0 strategy for authentication, including serialization and deserialization of user information for session management, and defining routes for initiating Google authentication and handling the callback after authentication is complete, as well as a logout route to clear the session and log the user out
app.use(session({
  secret: JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: isProduction ? "none" : "lax",
    secure: isProduction,
    maxAge: 1000 * 60 * 60 * 24,
  },
}));

app.use(passport.initialize());
app.use(passport.session());

// Passport serialization
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// Google Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: GOOGLE_CALLBACK_URL
  },
  (accessToken, refreshToken, profile, done) => {
    return done(null, profile);
  }
));

// Google auth route
app.get("/api/auth/google",
  (req, res, next) => {
    const { mode, role, organization } = req.query;
    let linkUserId = undefined;
    
    // Attempt to identify current user if mode is link
    if (mode === "link") {
      const token = getToken(req);
      if (token) {
        try {
          const payload = jwt.verify(token, JWT_SECRET);
          linkUserId = payload.sub;
        } catch {}
      }
    }

    const oauthMeta = {
      mode: mode === "link" ? "link" : (mode === "signup" ? "signup" : "login"),
      role: typeof role === "string" ? role : undefined,
      organization: typeof organization === "string" ? organization : undefined,
      linkUserId
    };

    if (req.session) {
      req.session.oauth = oauthMeta;
    }
    const stateToken = jwt.sign(oauthMeta, JWT_SECRET, { expiresIn: "15m" });
    passport.authenticate("google", {
      scope: ["profile", "email"],
      prompt: "select_account",
      state: stateToken,
    })(req, res, next);
  }
);

// Google callback (Supporting both legacy and proxied paths for maximum compatibility)
const handleGoogleCallback = async (req, res) => {
  try {
    const { email, fullName, profilePic, oauthId } = getGoogleProfile(req.user);
    if (!email) {
      return res.redirect(`${CLIENT_ORIGIN}/login?oauth=missing_email`);
    }

    const stateMeta = decodeOauthState(req.query?.state);
    let oauthMeta = stateMeta || req.session?.oauth || {};
    
    // Safety
    const token = getToken(req);
    if (token) {
      try {
        const payload = jwt.verify(token, JWT_SECRET);
        if (oauthMeta.mode !== "login") oauthMeta.mode = "link";
        oauthMeta.linkUserId = payload.sub;
      } catch {}
    }

    const mode = oauthMeta.mode || "login";
    
    let user;
    if (mode === "link" && oauthMeta.linkUserId) {
      user = await linkGoogleProvider(oauthMeta.linkUserId, { email, fullName, profilePic, oauthId });
    } else {
      const existing = await User.findOne({ email });
      if (!existing && mode !== "signup") {
        return res.redirect(`${CLIENT_ORIGIN}/signup?oauth=signup_required`);
      }

      user = await upsertGoogleUser({
        email,
        fullName,
        profilePic,
        role: oauthMeta.role,
        organization: oauthMeta.organization,
        oauthId,
      });
    }

    if (req.session?.oauth) delete req.session.oauth;

    const newToken = signToken(user);
    setAuthCookie(res, newToken);

    if (mode === "link" || token) {
      return res.redirect(`${CLIENT_ORIGIN}/profile?oauth=linked`);
    }

    return res.redirect(CLIENT_ORIGIN);
  } catch (err) {
    console.error("❌ GOOGLE AUTH CALLBACK ERROR:", err);
    const token = getToken(req);
    if (token || (req.query?.state && decodeOauthState(req.query.state)?.mode === "link")) {
      const msg = encodeURIComponent(err.message || "Account connection failed.");
      return res.redirect(`${CLIENT_ORIGIN}/profile?oauth_error=${msg}`);
    }
    return res.redirect(`${CLIENT_ORIGIN}/login?oauth=error`);
  }
};

app.post("/api/auth/google/disconnect", requireAuth, async (req, res) => {
  const user = await User.findOne({ id: req.userId });
  if (!user) return res.status(404).json({ message: "User not found." });

  const hasAlternative = user.linkedProviders.length > 1 || (user.password && user.password.length > 20);
  if (!hasAlternative) {
    return res.status(400).json({ message: "Cannot disconnect your only login method." });
  }

  user.linkedProviders = user.linkedProviders.filter(p => p !== "google");
  user.googleId = null;
  user.googleEmail = "";
  await user.save();
  return res.json({ message: "Google account disconnected successfully.", user });
});

app.get("/api/auth/google/callback",
  passport.authenticate("google", { failureRedirect: `${CLIENT_ORIGIN}/login?oauth=failed` }),
  handleGoogleCallback
);

app.get("/auth/google/callback",
  passport.authenticate("google", { failureRedirect: `${CLIENT_ORIGIN}/login?oauth=failed` }),
  handleGoogleCallback
);

// Logout route to clear the session and log the user out of the application
app.get("/logout", (req, res) => {
  req.logout(() => {
    res.redirect("/");
  });
});

// Start the server and listen on the specified port, logging a message to indicate that the server is running and providing the URL for access to the authentication API endpoints
const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`ITMS auth server running on http://localhost:${PORT}`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`❌ PORT ${PORT} is already in use. Please kill the other process or use a different port.`);
    process.exit(1);
  } else {
    console.error("❌ SERVER ERROR:", err.message);
  }
});

process.on("uncaughtException", (err) => {
  console.error("❌ UNCAUGHT EXCEPTION:", err.message);
  console.error(err.stack);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ UNHANDLED REJECTION at:", promise, "reason:", reason);
});
