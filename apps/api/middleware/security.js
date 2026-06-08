import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import cors from "cors";

const isProduction = process.env.NODE_ENV === "production";
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";
const SERVER_URL = process.env.SERVER_URL || "http://localhost:4000";

// Configure CORS dynamically
const allowedOrigins = [CLIENT_ORIGIN, SERVER_URL].filter(Boolean);

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Same-origin or non-browser request (like curl/server-to-server)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || (!isProduction && origin.startsWith("http://localhost"))) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true
});

// Configure Helmet security headers
export const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "img-src": ["'self'", "data:", "https://res.cloudinary.com", "https://*.tile.openstreetmap.org", "https://*.google.com"],
      "media-src": ["'self'", "data:", "https://res.cloudinary.com"],
      "connect-src": ["'self'", "https://res.cloudinary.com", "http://127.0.0.1:8001"]
    }
  }
});

// Gzip response compression
export const compressionMiddleware = compression();

// Standard rate limiter for all endpoints (5000 reqs per 15 min to accommodate operator dashboard polling)
export const standardRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5000,
  message: { message: "Too many requests from this IP. Please try again after 15 minutes." },
  standardHeaders: "draft-7",
  legacyHeaders: false
});

// Strict rate limiter for authentication/sensitive endpoints (15 reqs per 15 min)
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  message: { message: "Too many authentication attempts. Please try again after 15 minutes." },
  standardHeaders: "draft-7",
  legacyHeaders: false
});

// Size limit for JSON requests (e.g. 5MB)
export const requestLimitMiddleware = (req, res, next) => {
  // express.json({ limit: "5mb" }) is wired directly in server.js
  next();
};
