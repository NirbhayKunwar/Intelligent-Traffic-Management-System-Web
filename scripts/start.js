import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

// Load environment variables from root .env and sub-app .env
dotenv.config();
const apiEnvPath = path.join(rootDir, "apps", "api", "data", ".env");
if (existsSync(apiEnvPath)) {
  dotenv.config({ path: apiEnvPath, override: true });
}

const isProduction = process.env.NODE_ENV === "production";

console.log(`🚀 Launching ITMS Services in [${process.env.NODE_ENV || "development"}] mode...`);

if (isProduction) {
  // Production mode: run PM2 configuration
  console.log("⚡ Starting PM2 runtime orchestration...");
  const pm2Config = path.join(rootDir, "infrastructure", "ecosystem.config.js");
  
  const pm2Process = spawn("npx", ["pm2-runtime", "start", pm2Config], {
    cwd: rootDir,
    stdio: "inherit",
    shell: true
  });

  pm2Process.on("close", (code) => {
    process.exit(code);
  });
} else {
  // Development mode: run concurrently
  console.log("⚡ Starting concurrent development processes...");

  // 1. Start Python FastAPI Microservice
  console.log("🤖 Starting AI Model Service on port 8001...");
  
  // Find python executable
  const pythonCmd = process.platform === "win32" ? "python" : "python3";
  const aiProcess = spawn(pythonCmd, ["app.py"], {
    cwd: path.join(rootDir, "apps", "ai"),
    stdio: "inherit",
    shell: true
  });

  // 2. Start Node Express Backend
  console.log("🌐 Starting Express API Backend on port 4000...");
  const apiProcess = spawn("node", ["server.js"], {
    cwd: path.join(rootDir, "apps", "api"),
    stdio: "inherit",
    shell: true
  });

  // Handle process termination lifecycle
  const killProcesses = () => {
    console.log("\n🔌 Terminating ITMS services...");
    aiProcess.kill();
    apiProcess.kill();
  };

  process.on("SIGINT", () => {
    killProcesses();
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    killProcesses();
    process.exit(0);
  });

  aiProcess.on("close", (code) => {
    console.error(`❌ AI Service exited with code ${code}. Shutting down backend...`);
    apiProcess.kill();
    process.exit(code);
  });

  apiProcess.on("close", (code) => {
    console.error(`❌ Express API Backend exited with code ${code}. Shutting down AI service...`);
    aiProcess.kill();
    process.exit(code);
  });
}
