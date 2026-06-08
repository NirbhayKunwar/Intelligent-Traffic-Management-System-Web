import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import cors from "cors";

const isProduction = process.env.NODE_ENV === "production";
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";
const SERVER_URL = process.env.SERVER_URL || "http://localhost:4000";

const allowedOrigins = [CLIENT_ORIGIN, SERVER_URL].filter(Boolean);

export const corsMiddleware = isProduction
  ? cors({ origin: true, credentials: true })
  : cors({
      origin: (origin, callback) => {
        // Allow same-origin or non-browser request (curl/server-to-server)
        if (!origin) return callback(null, true);
        if (
          allowedOrigins.includes(origin) ||
          (!isProduction && origin.startsWith("http://localhost"))
        ) {
          return callback(null, true);
        }
        return callback(new Error("Not allowed by CORS"));
      },
      credentials: true,
    });

export const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "img-src": ["'self'", "data:", "https://res.cloudinary.com", "https://*.tile.openstreetmap.org", "https://*.google.com"],
      "media-src": ["'self'", "data:", "https://res.cloudinary.com"],
      "connect-src": ["'self'", "https://res.cloudinary.com", "http://127.0.0.1:8001"],
    },
  },
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
