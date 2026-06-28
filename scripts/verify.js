import { existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

console.log("🔍 Running System Verification Checks...\n");

const requiredPaths = [
  "apps/web/src/App.jsx",
  "apps/api/server.js",
  "apps/ai/app.py",
  "packages/shared/package.json",
  "infrastructure/Dockerfile",
  "infrastructure/ecosystem.config.js",
  "apps/api/data/.env.example",
  "package.json"
];

let failed = false;

// 1. Verify files exist
console.log("📂 Checking directory layout and files:");
for (const p of requiredPaths) {
  const absPath = path.join(rootDir, p);
  if (existsSync(absPath)) {
    console.log(`  ✅ [OK]  Found: ${p}`);
  } else {
    console.error(`  ❌ [ERR] Missing: ${p}`);
    failed = true;
  }
}

// 2. Load and verify env parameters
console.log("\n🔑 Checking environment variables:");
const rootEnvPath = path.join(rootDir, ".env");
const apiEnvPath = path.join(rootDir, "apps", "api", "data", ".env");

if (existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
  console.log("  ℹ️  Loaded .env from root directory");
}
if (existsSync(apiEnvPath)) {
  dotenv.config({ path: apiEnvPath, override: true });
  console.log("  ℹ️  Loaded .env from apps/api/data/.env (overriding root values if any)");
}

if (!existsSync(rootEnvPath) && !existsSync(apiEnvPath)) {
  console.log("  ⚠️  Warning: No local .env file found at root or apps/api/data/.env (will rely on environment)");
}

const requiredEnvVars = ["MONGODB_URI", "JWT_SECRET", "CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"];
for (const v of requiredEnvVars) {
  if (process.env[v]) {
    console.log(`  ✅ [OK]  Variable '${v}' is set.`);
  } else {
    console.warn(`  ⚠️  [WARN] Variable '${v}' is NOT set. It will be required in production!`);
  }
}

console.log("\n📊 Verification Summary:");
if (failed) {
  console.error("❌ VERIFICATION FAILED! Please resolve the missing path issues before building.");
  process.exit(1);
} else {
  console.log("✅ SYSTEM READY FOR DEPLOYMENT!");
  process.exit(0);
}
