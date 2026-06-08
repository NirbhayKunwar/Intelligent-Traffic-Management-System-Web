import winston from "winston";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === "production";
const LOGS_DIR = path.resolve(__dirname, "..", "..", "..", "logs", "api");

// Define winston formats
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
    return `[${timestamp}] [${level.toUpperCase()}]: ${message}${metaStr}`;
  })
);

// Instantiate winston logger
export const logger = winston.createLogger({
  level: isProduction ? "info" : "debug",
  format: isProduction ? winston.format.combine(winston.format.timestamp(), winston.format.json()) : customFormat,
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ 
      filename: path.join(LOGS_DIR, "error.log"), 
      level: "error",
      maxsize: 5242880, // 5MB
      maxFiles: 5 
    }),
    new winston.transports.File({ 
      filename: path.join(LOGS_DIR, "access.log"),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// Setup Morgan request logger stream
const morganStream = {
  write: (message) => {
    logger.info(message.trim());
  }
};

// Morgan request logging format depending on environment
export const requestLogger = morgan(
  isProduction 
    ? ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" - :response-time ms'
    : "dev",
  { stream: morganStream }
);
