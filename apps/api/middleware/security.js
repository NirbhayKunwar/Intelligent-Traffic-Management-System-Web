import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import cors from "cors";

const isProduction = process.env.NODE_ENV === "production";
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";
const SERVER_URL = process.env.SERVER_URL || "http://localhost:4000";

const allowedOrigins = [
  CLIENT_ORIGIN,
  SERVER_URL,
  "http://localhost:5173",
  "http://localhost:4000",
].filter(Boolean);

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, mobile apps, server-to-server)
    if (!origin) return callback(null, true);
    // Allow any vercel.app subdomain and any explicitly listed origin
    const isVercel = /\.vercel\.app$/.test(origin);
    const isAllowed = allowedOrigins.includes(origin);
    if (isVercel || isAllowed) {
      return callback(null, origin);
    }
    return callback(null, true); // Allow all origins (open API)
  },
  credentials: true,
});

const RENDER_API_URL = process.env.SERVER_URL || "https://itms-api.onrender.com";

export const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "img-src": [
        "'self'",
        "data:",
        "blob:",
        "https://res.cloudinary.com",
        "https://lh3.googleusercontent.com",
        "https://*.tile.openstreetmap.org",
        "https://*.openstreetmap.org",
        "https://*.cartocdn.com",
        "https://*.google.com"
      ],
      "media-src": [
        "'self'",
        "data:",
        "blob:",
        "https://res.cloudinary.com",
        RENDER_API_URL,
        "https://*.onrender.com"
      ],
      "connect-src": [
        "'self'",
        "https://res.cloudinary.com",
        "https://nominatim.openstreetmap.org",
        "https://router.project-osrm.org",
        "http://127.0.0.1:8001",
        RENDER_API_URL,
        "https://*.onrender.com",
        "https://*.vercel.app"
      ],
    },
  },
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
});

export const compressionMiddleware = compression();

export const standardRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5000,
  message: { message: "Too many requests from this IP. Please try again after 15 minutes." },
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  message: { message: "Too many authentication attempts. Please try again after 15 minutes." },
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

export const requestLimitMiddleware = (req, res, next) => {
  next();
};
